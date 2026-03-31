const mongoose = require('mongoose');
const AuthModel = require('../models/AuthModel');
const Application = require('../models/applicationModel');
const MessOff = require('../models/Messoff');
const MessBill = require('../models/MessBill');

const BASE_MESS_FEE = 5200;
const REBATE_PER_DAY = 98;

const toStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const toEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const dayDiffInclusive = (start, end) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const normalizedStart = toStartOfDay(start);
  const normalizedEnd = toStartOfDay(end);
  return Math.floor((normalizedEnd - normalizedStart) / msPerDay) + 1;
};

const applySession = (query, session) => (session ? query.session(session) : query);

const getAllottedStudentIds = async (session) => {
  const allottedApplications = await applySession(
    Application.find({ status: 'ALLOTTED' }).select('studentId'),
    session
  ).lean();

  return [...new Set(
    allottedApplications
      .map((app) => String(app.studentId || '').trim())
      .filter(Boolean)
  )];
};

const getCollegeIdCandidates = (studentId) => {
  const normalized = String(studentId || '').trim();
  const candidateIds = new Set();

  const directNumeric = Number(normalized);
  if (Number.isFinite(directNumeric)) {
    candidateIds.add(directNumeric);
  }

  const trailingDigits = normalized.match(/(\d+)$/);
  if (trailingDigits) {
    const trailingNumeric = Number(trailingDigits[1]);
    if (Number.isFinite(trailingNumeric)) {
      candidateIds.add(trailingNumeric);
    }
  }

  return [...candidateIds];
};

const getUserByStudentIdMap = async (allottedStudentIds, session) => {
  const candidateIdsByStudentId = new Map(
    allottedStudentIds.map((studentId) => [String(studentId), getCollegeIdCandidates(studentId)])
  );

  const candidateCollegeIds = [...new Set(
    [...candidateIdsByStudentId.values()].flat().filter((id) => Number.isFinite(id))
  )];

  if (candidateCollegeIds.length === 0) {
    return new Map();
  }

  const allottedUsers = await applySession(
    AuthModel.find({
      collegeId: { $in: candidateCollegeIds },
      $or: [{ role: 'student' }, { role: { $exists: false } }]
    }).sort({ _id: 1 }),
    session
  );

  const userByCollegeId = new Map();
  for (const user of allottedUsers) {
    const collegeIdKey = String(user.collegeId);
    // Keep first account deterministically when duplicate collegeId users exist.
    if (!userByCollegeId.has(collegeIdKey)) {
      userByCollegeId.set(collegeIdKey, user);
    }
  }
  const userByStudentId = new Map();

  for (const studentId of allottedStudentIds) {
    const candidates = candidateIdsByStudentId.get(String(studentId)) || [];
    const matchedCandidate = candidates.find((candidate) => userByCollegeId.has(String(candidate)));
    if (matchedCandidate == null) {
      continue;
    }

    userByStudentId.set(String(studentId), userByCollegeId.get(String(matchedCandidate)));
  }

  return userByStudentId;
};

const getLinkedStudentAccountIds = async (authUser) => {
  const accountIds = new Set();

  if (mongoose.Types.ObjectId.isValid(String(authUser?.id || ''))) {
    accountIds.add(String(authUser.id));
  }

  const collegeId = Number(authUser?.collegeId);
  if (Number.isFinite(collegeId)) {
    const siblingStudentAccounts = await AuthModel.find({
      collegeId,
      $or: [{ role: 'student' }, { role: { $exists: false } }]
    }).select('_id').sort({ _id: 1 }).lean();

    for (const sibling of siblingStudentAccounts) {
      accountIds.add(String(sibling._id));
    }
  }

  return [...accountIds];
};

const getExistingMonthlyBill = async (studentObjectId, month, year, session) => {
  return applySession(
    MessBill.findOne({ studentId: studentObjectId, month, year }),
    session
  );
};

const calculateStudentMonthlyBill = async (userDoc, cycleStart, cycleEnd, session, options = {}) => {
  const approvedLeaves = await applySession(
    MessOff.find({
      studentId: userDoc._id,
      status: 'APPROVED',
      startDate: { $lte: cycleEnd },
      endDate: { $gte: cycleStart }
    }),
    session
  );

  let approvedLeaveDays = 0;

  for (const leave of approvedLeaves) {
    const overlapStart = toStartOfDay(new Date(Math.max(cycleStart.getTime(), new Date(leave.startDate).getTime())));
    const overlapEnd = toStartOfDay(new Date(Math.min(cycleEnd.getTime(), new Date(leave.endDate).getTime())));

    if (overlapEnd < overlapStart) {
      continue;
    }

    const overlapDays = dayDiffInclusive(overlapStart, overlapEnd);
    const approvedDaysForLeave = Math.max(0, Number(leave.approvedDays || 0));
    const daysCounted = approvedDaysForLeave > 0
      ? Math.min(approvedDaysForLeave, overlapDays)
      : overlapDays;

    approvedLeaveDays += daysCounted;
  }

  const messOffRebate = approvedLeaveDays * REBATE_PER_DAY;
  const arrearsSource = options.arrearsOverride != null ? options.arrearsOverride : userDoc.messBalance;
  const arrears = Number(arrearsSource || 0);
  const totalDue = Math.max(0, (BASE_MESS_FEE + arrears) - messOffRebate);

  return {
    approvedLeaveDays,
    messOffRebate,
    arrears,
    totalDue
  };
};

exports.createMessOffRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated user.' });
    }

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required.' });
    }

    const start = toStartOfDay(startDate);
    const end = toEndOfDay(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startDate or endDate.' });
    }

    if (end < start) {
      return res.status(400).json({ success: false, message: 'endDate must be on or after startDate.' });
    }

    const totalDays = dayDiffInclusive(start, end);

    const requestDoc = await MessOff.create({
      studentId: userId,
      startDate: start,
      endDate: end,
      approvedDays: totalDays,
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: 'Mess-off request submitted for approval.',
      data: requestDoc,
      totalDays
    });
  } catch (error) {
    console.error('Error creating mess-off request:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.generateMonthlyMessBills = async (req, res) => {
  const now = new Date();
  const month = Number(req.body?.month || now.getMonth() + 1);
  const year = Number(req.body?.year || now.getFullYear());
  const previewMode = req.query?.preview === 'true' || req.body?.preview === true;
  const regenerateExisting = req.query?.regenerateExisting === 'true' || req.body?.regenerateExisting === true;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ success: false, message: 'month must be an integer from 1 to 12.' });
  }

  if (!Number.isInteger(year) || year < 2000) {
    return res.status(400).json({ success: false, message: 'year must be a valid integer (>= 2000).' });
  }

  const cycleStart = toStartOfDay(new Date(year, month - 1, 1));
  const cycleEnd = toEndOfDay(new Date(year, month, 0));
  const summary = {
    month,
    year,
    cycleStart,
    cycleEnd,
    totalAllotted: 0,
    previewCount: 0,
    previewCreateCount: 0,
    previewUpdateCount: 0,
    billsCreated: 0,
    billsUpdated: 0,
    skippedExisting: 0,
    skippedPaidExisting: 0,
    skippedMissingUsers: 0,
    totalProjectedDue: 0,
    totalProjectedRebate: 0,
    createdBillIds: [],
    updatedBillIds: [],
    regenerateExisting
  };

  if (previewMode) {
    try {
      const allottedStudentIds = await getAllottedStudentIds();
      summary.totalAllotted = allottedStudentIds.length;

      const userByStudentId = await getUserByStudentIdMap(allottedStudentIds);
      const previewList = [];
      const existingBillList = [];

      for (const studentId of allottedStudentIds) {
        const userDoc = userByStudentId.get(String(studentId));

        if (!userDoc) {
          summary.skippedMissingUsers += 1;
          continue;
        }

        const existingBill = await getExistingMonthlyBill(userDoc._id, month, year);

        if (existingBill && !regenerateExisting) {
          summary.skippedExisting += 1;
          existingBillList.push({
            billId: String(existingBill._id),
            studentDbId: String(userDoc._id),
            studentName: userDoc.name,
            collegeId: userDoc.collegeId,
            status: existingBill.status,
            totalDue: Number(existingBill.totalDue || 0)
          });
          continue;
        }

        if (existingBill && regenerateExisting && existingBill.status === 'PAID') {
          summary.skippedPaidExisting += 1;
          existingBillList.push({
            billId: String(existingBill._id),
            studentDbId: String(userDoc._id),
            studentName: userDoc.name,
            collegeId: userDoc.collegeId,
            status: existingBill.status,
            totalDue: Number(existingBill.totalDue || 0)
          });
          continue;
        }

        let billPreview;
        if (existingBill && regenerateExisting) {
          const arrearsExcludingCurrentBill = Number(userDoc.messBalance || 0) - Number(existingBill.totalDue || 0);
          billPreview = await calculateStudentMonthlyBill(userDoc, cycleStart, cycleEnd, null, {
            arrearsOverride: Math.max(0, arrearsExcludingCurrentBill)
          });
          summary.previewUpdateCount += 1;
        } else {
          billPreview = await calculateStudentMonthlyBill(userDoc, cycleStart, cycleEnd);
          summary.previewCreateCount += 1;
        }

        summary.previewCount += 1;
        summary.totalProjectedDue += Number(billPreview.totalDue || 0);
        summary.totalProjectedRebate += Number(billPreview.messOffRebate || 0);

        previewList.push({
          operation: existingBill ? 'UPDATE_EXISTING' : 'CREATE_NEW',
          existingBillId: existingBill ? String(existingBill._id) : null,
          existingBillStatus: existingBill ? existingBill.status : null,
          studentDbId: String(userDoc._id),
          studentName: userDoc.name,
          studentEmail: userDoc.email,
          collegeId: userDoc.collegeId,
          currentMessBalance: Number(userDoc.messBalance || 0),
          baseFee: BASE_MESS_FEE,
          approvedLeaveDays: billPreview.approvedLeaveDays,
          messOffRebate: billPreview.messOffRebate,
          arrears: billPreview.arrears,
          totalDue: billPreview.totalDue
        });
      }

      return res.status(200).json({
        success: true,
        mode: 'preview',
        message: summary.previewCount > 0
          ? 'Preview generated successfully.'
          : 'No actionable bills in preview. Bills may already exist for this month.',
        summary,
        previewList,
        existingBillList
      });
    } catch (error) {
      console.error('Error generating monthly mess bill preview:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate mess bill preview', error: error.message });
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const allottedStudentIds = await getAllottedStudentIds(session);

      summary.totalAllotted = allottedStudentIds.length;
      const userByStudentId = await getUserByStudentIdMap(allottedStudentIds, session);

      for (const studentId of allottedStudentIds) {
        const userDoc = userByStudentId.get(String(studentId));

        if (!userDoc) {
          summary.skippedMissingUsers += 1;
          continue;
        }

        const existingBill = await getExistingMonthlyBill(userDoc._id, month, year, session);

        if (existingBill && !regenerateExisting) {
          summary.skippedExisting += 1;
          continue;
        }

        if (existingBill && regenerateExisting && existingBill.status === 'PAID') {
          summary.skippedPaidExisting += 1;
          continue;
        }

        let computedBill;
        if (existingBill && regenerateExisting) {
          const arrearsExcludingCurrentBill = Number(userDoc.messBalance || 0) - Number(existingBill.totalDue || 0);
          computedBill = await calculateStudentMonthlyBill(userDoc, cycleStart, cycleEnd, session, {
            arrearsOverride: Math.max(0, arrearsExcludingCurrentBill)
          });
        } else {
          computedBill = await calculateStudentMonthlyBill(userDoc, cycleStart, cycleEnd, session);
        }

        const messOffRebate = computedBill.messOffRebate;
        const arrears = computedBill.arrears;
        const totalDue = computedBill.totalDue;
        summary.totalProjectedDue += Number(totalDue || 0);
        summary.totalProjectedRebate += Number(messOffRebate || 0);

        if (existingBill && regenerateExisting) {
          const previousTotalDue = Number(existingBill.totalDue || 0);
          existingBill.baseFee = BASE_MESS_FEE;
          existingBill.messOffRebate = messOffRebate;
          existingBill.arrears = arrears;
          existingBill.totalDue = totalDue;
          await existingBill.save({ session });

          const dueDelta = totalDue - previousTotalDue;
          if (dueDelta !== 0) {
            userDoc.messBalance = Number(userDoc.messBalance || 0) + dueDelta;
            await userDoc.save({ session });
          }

          summary.billsUpdated += 1;
          summary.updatedBillIds.push(String(existingBill._id));
          continue;
        }

        const bill = await MessBill.create([
          {
            studentId: userDoc._id,
            month,
            year,
            baseFee: BASE_MESS_FEE,
            messOffRebate,
            arrears,
            totalDue,
            status: 'PENDING',
            utrNumber: null
          }
        ], { session });

        userDoc.messBalance = Number(userDoc.messBalance || 0) + totalDue;
        await userDoc.save({ session });

        summary.billsCreated += 1;
        summary.createdBillIds.push(String(bill[0]._id));
      }
    });

    return res.status(201).json({
      success: true,
      mode: 'publish',
      message: summary.billsCreated > 0 || summary.billsUpdated > 0
        ? 'Monthly mess bills processed successfully.'
        : 'No bills were created for this month. Bills may already exist.',
      summary
    });
  } catch (error) {
    console.error('Error generating monthly mess bills:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate mess bills', error: error.message });
  } finally {
    await session.endSession();
  }
};

exports.getCurrentStudentMessBill = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated user.' });
    }

    const linkedAccountIds = await getLinkedStudentAccountIds(req.user);

    if (linkedAccountIds.length === 0) {
      return res.status(404).json({ success: false, message: 'No linked student account found for billing.' });
    }

    const activeBill = await MessBill.findOne({
      studentId: { $in: linkedAccountIds },
      status: { $in: ['PENDING', 'VERIFICATION'] }
    }).sort({ year: -1, month: -1, createdAt: -1 });

    const latestBill = await MessBill.findOne({
      studentId: { $in: linkedAccountIds }
    }).sort({ year: -1, month: -1, createdAt: -1 });

    const recentBills = await MessBill.find({
      studentId: { $in: linkedAccountIds }
    })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .limit(12);

    return res.status(200).json({
      success: true,
      // Backward compatibility for older frontend implementations.
      data: activeBill || latestBill || null,
      activeBill: activeBill || null,
      latestBill: latestBill || null,
      recentBills: recentBills || []
    });
  } catch (error) {
    console.error('Error fetching current student mess bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch mess bill', error: error.message });
  }
};

exports.submitMessBillUtr = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated user.' });
    }

    const linkedAccountIds = await getLinkedStudentAccountIds(req.user);

    if (linkedAccountIds.length === 0) {
      return res.status(404).json({ success: false, message: 'No linked student account found for billing.' });
    }

    const { billId, utrNumber } = req.body;
    const normalizedUtr = String(utrNumber || '').trim();

    if (!normalizedUtr) {
      return res.status(400).json({ success: false, message: 'UTR Number is required.' });
    }

    let bill;
    if (billId) {
      bill = await MessBill.findOne({ _id: billId, studentId: { $in: linkedAccountIds } });
    } else {
      bill = await MessBill.findOne({
        studentId: { $in: linkedAccountIds },
        status: { $in: ['PENDING', 'VERIFICATION'] }
      }).sort({ year: -1, month: -1, createdAt: -1 });
    }

    if (!bill) {
      return res.status(404).json({ success: false, message: 'No active mess bill found for this student.' });
    }

    if (bill.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This bill is already marked as PAID.' });
    }

    bill.utrNumber = normalizedUtr;
    bill.status = 'VERIFICATION';
    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'UTR submitted successfully. Payment is under verification.',
      data: bill
    });
  } catch (error) {
    console.error('Error submitting mess bill UTR:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit UTR', error: error.message });
  }
};

exports.getPendingMessOffRequests = async (req, res) => {
  try {
    const requests = await MessOff.find({ status: 'PENDING' })
      .populate('studentId', 'name email collegeId roomNo')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching pending mess-off requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending mess-off requests', error: error.message });
  }
};

exports.approveMessOffRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const updated = await MessOff.findOneAndUpdate(
      { _id: requestId, status: 'PENDING' },
      { status: 'APPROVED' },
      { new: true }
    ).populate('studentId', 'name email collegeId roomNo');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pending mess-off request not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Mess-off request approved successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error approving mess-off request:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve mess-off request', error: error.message });
  }
};

exports.rejectMessOffRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const updated = await MessOff.findOneAndUpdate(
      { _id: requestId, status: 'PENDING' },
      { status: 'REJECTED' },
      { new: true }
    ).populate('studentId', 'name email collegeId roomNo');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pending mess-off request not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Mess-off request rejected successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting mess-off request:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject mess-off request', error: error.message });
  }
};

exports.getVerificationMessBills = async (req, res) => {
  try {
    const bills = await MessBill.find({ status: 'VERIFICATION' })
      .populate('studentId', 'name email collegeId roomNo messBalance')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Error fetching verification mess bills:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch verification mess bills', error: error.message });
  }
};

exports.approveMessBillVerification = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { billId } = req.params;
    let updatedBillId;

    await session.withTransaction(async () => {
      const bill = await MessBill.findOne({ _id: billId, status: 'VERIFICATION' }).session(session);

      if (!bill) {
        const notFoundError = new Error('Verification bill not found.');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      const user = await AuthModel.findById(bill.studentId).session(session);
      if (!user) {
        const userNotFoundError = new Error('Student record not found for this bill.');
        userNotFoundError.statusCode = 404;
        throw userNotFoundError;
      }

      bill.status = 'PAID';
      await bill.save({ session });

      user.messBalance = Number(user.messBalance || 0) - Number(bill.totalDue || 0);
      await user.save({ session });

      updatedBillId = bill._id;
    });

    const updatedBill = await MessBill.findById(updatedBillId).populate('studentId', 'name email collegeId roomNo messBalance');

    return res.status(200).json({
      success: true,
      message: 'Mess bill payment approved and marked as PAID.',
      data: updatedBill
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('Error approving verification mess bill:', error);
    return res.status(statusCode).json({ success: false, message: error.message || 'Failed to approve verification bill' });
  } finally {
    await session.endSession();
  }
};

exports.rejectMessBillVerification = async (req, res) => {
  try {
    const { billId } = req.params;

    const updatedBill = await MessBill.findOneAndUpdate(
      { _id: billId, status: 'VERIFICATION' },
      { status: 'PENDING', utrNumber: null },
      { new: true }
    ).populate('studentId', 'name email collegeId roomNo messBalance');

    if (!updatedBill) {
      return res.status(404).json({ success: false, message: 'Verification bill not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification rejected. Bill moved back to PENDING and UTR cleared.',
      data: updatedBill
    });
  } catch (error) {
    console.error('Error rejecting verification mess bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject verification bill', error: error.message });
  }
};
