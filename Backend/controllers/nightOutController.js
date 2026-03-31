const NightOutPass = require('../models/NightOutPass');
const Application = require('../models/applicationModel');
const Room = require('../models/roomModel');
const { getManagedBlocks, normalizeBlock } = require('../utils/wardenAccess');
const { getAuthStudentId, getOwnedIdClause, getOwnedStudentMatchQuery, isOwnedStudentId, normalizeStudentId } = require('../utils/studentIdentity');

/**
 * Night Out Pass Controller
 */

const deriveHostelBlockFromRoomNumber = (roomNumber = '') => {
  const normalizedRoom = String(roomNumber || '').trim().toUpperCase();
  if (normalizedRoom.startsWith('A-')) return 'A';
  if (normalizedRoom.startsWith('C-')) return 'C';
  if (normalizedRoom.startsWith('T-') || normalizedRoom.startsWith('PG-')) return 'PG';
  return 'UNKNOWN';
};

const buildManagedBlockScope = (managedBlocks = []) => {
  if (!Array.isArray(managedBlocks) || managedBlocks.length === 0) {
    return { hostelBlock: 'UNKNOWN' };
  }

  const clauses = [];
  if (managedBlocks.includes('A')) {
    clauses.push({ hostelBlock: 'A' });
    clauses.push({ roomNumber: { $regex: /^A-/i } });
  }
  if (managedBlocks.includes('C')) {
    clauses.push({ hostelBlock: 'C' });
    clauses.push({ roomNumber: { $regex: /^C-/i } });
  }
  if (managedBlocks.includes('PG')) {
    clauses.push({ hostelBlock: 'PG' });
    clauses.push({ roomNumber: { $regex: /^T-/i } });
    clauses.push({ roomNumber: { $regex: /^PG-/i } });
  }

  return clauses.length > 0 ? { $or: clauses } : { hostelBlock: 'UNKNOWN' };
};

const isPassAccessibleByWarden = (req, pass) => {
  if (!req.warden) return true; // Admin endpoints do not carry warden context.

  const managedBlocks = req.managedBlocks || getManagedBlocks(req.warden);
  const passBlock = normalizeBlock(pass.hostelBlock || deriveHostelBlockFromRoomNumber(pass.roomNumber));
  return managedBlocks.includes(passBlock);
};

const resolveStaffActor = (req, fallback = 'admin') => {
  if (req.warden?.email) return req.warden.email;
  if (req.body?.adminId) return req.body.adminId;
  if (req.body?.guardName) return req.body.guardName;
  return fallback;
};

// Create a new pass request (Student)
exports.createPassRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { 
      studentId, studentName, roomNumber, contactNumber, parentContact,
      passType, reason, destination, 
      departureDate, departureTime, expectedReturnDate, expectedReturnTime,
      emergencyContact
    } = req.body;

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ success: false, message: 'You can only create passes for your own account.' });
    }

    const normalizedStudentId = studentId
      ? normalizeStudentId(studentId)
      : authStudentId;

    if (!normalizedStudentId || !passType || !reason || !destination || 
        !departureDate || !expectedReturnDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate dates
    const depDate = new Date(departureDate);
    const retDate = new Date(expectedReturnDate);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    if (depDate < todayStart) {
      return res.status(400).json({ success: false, message: 'Departure date cannot be in the past' });
    }

    if (retDate < depDate) {
      return res.status(400).json({ success: false, message: 'Return date must be after departure date' });
    }

    // Check for overlapping pending/approved requests
    const overlapping = await NightOutPass.findOne({
      studentId: normalizedStudentId,
      status: { $in: ['PENDING', 'APPROVED', 'ACTIVE'] },
      $or: [
        { departureDate: { $lte: retDate }, expectedReturnDate: { $gte: depDate } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have an overlapping pass request for these dates' 
      });
    }

    // Limit pending requests
    const pendingCount = await NightOutPass.countDocuments({
      studentId: normalizedStudentId,
      status: 'PENDING'
    });

    if (pendingCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have too many pending requests. Please wait for approval.' 
      });
    }

    // Resolve authoritative room/block from allotment when available.
    let resolvedRoomNumber = roomNumber || 'UNKNOWN';
    let resolvedHostelBlock = deriveHostelBlockFromRoomNumber(roomNumber);

    const ownedAppQuery = getOwnedStudentMatchQuery(authStudentId);
    const application = ownedAppQuery
      ? await Application.findOne(ownedAppQuery).populate('allottedRoom')
      : null;

    const canonicalStudentId = application?.studentId || normalizedStudentId;
    if (application?.allottedRoom) {
      resolvedRoomNumber = application.allottedRoom.roomNumber || resolvedRoomNumber;
      resolvedHostelBlock = normalizeBlock(application.allottedRoom.block);
    }

    if (!['A', 'C', 'PG'].includes(resolvedHostelBlock)) {
      const roomDoc = await Room.findOne({ roomNumber: resolvedRoomNumber });
      if (roomDoc?.block) {
        resolvedHostelBlock = normalizeBlock(roomDoc.block);
      }
    }

    if (!['A', 'C', 'PG'].includes(resolvedHostelBlock)) {
      resolvedHostelBlock = 'UNKNOWN';
    }

    const pass = new NightOutPass({
      studentId: canonicalStudentId,
      studentName: studentName || canonicalStudentId,
      roomNumber: resolvedRoomNumber,
      hostelBlock: resolvedHostelBlock,
      contactNumber: contactNumber || '',
      parentContact: parentContact || '',
      passType,
      reason,
      destination,
      departureDate: depDate,
      departureTime: departureTime || '18:00',
      expectedReturnDate: retDate,
      expectedReturnTime: expectedReturnTime || '20:00',
      emergencyContact: emergencyContact || null
    });

    await pass.save();

    res.status(201).json({
      success: true,
      message: 'Pass request submitted! Awaiting approval.',
      data: pass
    });
  } catch (error) {
    console.error('Create pass error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get student's passes
exports.getMyPasses = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const requestedStudentId = String(req.params.studentId || '').trim().toUpperCase();
    if (requestedStudentId && !isOwnedStudentId(authStudentId, requestedStudentId)) {
      return res.status(403).json({ success: false, message: 'You can only access your own passes.' });
    }

    const ownedStudentClause = getOwnedIdClause('studentId', authStudentId) || { studentId: authStudentId };

    const passes = await NightOutPass.find(ownedStudentClause)
      .sort({ createdAt: -1 })
      .limit(20);

    const stats = {
      pending: passes.filter(p => p.status === 'PENDING').length,
      approved: passes.filter(p => p.status === 'APPROVED').length,
      active: passes.filter(p => p.status === 'ACTIVE').length
    };

    res.status(200).json({ success: true, data: passes, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel a pending pass (Student)
exports.cancelPass = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { passId } = req.params;

    const pass = await NightOutPass.findById(passId);

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (!isOwnedStudentId(authStudentId, pass.studentId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['PENDING', 'APPROVED'].includes(pass.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this pass' });
    }

    pass.status = 'CANCELLED';
    await pass.save();

    res.status(200).json({
      success: true,
      message: 'Pass cancelled successfully',
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Get all pass requests (Admin)
exports.getAllPasses = async (req, res) => {
  try {
    const { status, passType, date } = req.query;
    const managedBlocks = req.warden ? (req.managedBlocks || getManagedBlocks(req.warden)) : null;

    const scopeQuery = managedBlocks ? buildManagedBlockScope(managedBlocks) : {};
    const query = { ...scopeQuery };
    if (status && status !== 'ALL') query.status = status;
    if (passType && passType !== 'ALL') query.passType = passType;
    
    // Filter by departure date
    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      query.departureDate = { $gte: dateStart, $lte: dateEnd };
    }

    const passes = await NightOutPass.find(query)
      .sort({ departureDate: 1, createdAt: -1 })
      .limit(100);

    const stats = {
      pending: await NightOutPass.countDocuments({ ...scopeQuery, status: 'PENDING' }),
      approved: await NightOutPass.countDocuments({ ...scopeQuery, status: 'APPROVED' }),
      active: await NightOutPass.countDocuments({ ...scopeQuery, status: 'ACTIVE' }),
      overdue: await NightOutPass.countDocuments({ ...scopeQuery, status: 'OVERDUE' })
    };

    res.status(200).json({ success: true, data: passes, stats, managedBlocks: managedBlocks || ['A', 'C', 'PG'] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Approve/Reject a pass (Admin)
exports.processPass = async (req, res) => {
  try {
    const { passId } = req.params;
    const { approve, rejectionReason, remarks, adminId } = req.body;

    const pass = await NightOutPass.findById(passId);

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (!isPassAccessibleByWarden(req, pass)) {
      return res.status(403).json({ success: false, message: 'You cannot process passes outside your managed blocks' });
    }

    if (pass.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Pass is not pending' });
    }

    const actor = req.warden ? resolveStaffActor(req, 'warden') : (adminId || 'admin');

    if (approve) {
      pass.status = 'APPROVED';
      pass.approvedBy = actor;
      pass.approvedAt = new Date();
    } else {
      pass.status = 'REJECTED';
      pass.rejectionReason = rejectionReason || 'Request not approved';
    }

    if (remarks) pass.remarks = remarks;

    await pass.save();

    res.status(200).json({
      success: true,
      message: approve ? 'Pass approved!' : 'Pass rejected',
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check out a student (Guard/Admin marks student as left)
exports.checkOut = async (req, res) => {
  try {
    const { passId } = req.params;

    const pass = await NightOutPass.findById(passId);

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (!isPassAccessibleByWarden(req, pass)) {
      return res.status(403).json({ success: false, message: 'You cannot check out students outside your managed blocks' });
    }

    if (pass.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Pass must be approved first' });
    }

    pass.status = 'ACTIVE';
    pass.checkedOutAt = new Date();
    pass.checkedOutBy = resolveStaffActor(req, 'Admin');
    await pass.save();

    res.status(200).json({
      success: true,
      message: 'Student checked out',
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check in a student (Guard/Admin marks student as returned)
exports.checkIn = async (req, res) => {
  try {
    const { passId } = req.params;

    const pass = await NightOutPass.findById(passId);

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (!isPassAccessibleByWarden(req, pass)) {
      return res.status(403).json({ success: false, message: 'You cannot check in students outside your managed blocks' });
    }

    if (!['ACTIVE', 'OVERDUE'].includes(pass.status)) {
      return res.status(400).json({ success: false, message: 'Student is not currently out' });
    }

    pass.status = 'COMPLETED';
    pass.actualReturnDate = new Date();
    pass.checkedInAt = new Date();
    pass.checkedInBy = resolveStaffActor(req, 'Admin');
    await pass.save();

    res.status(200).json({
      success: true,
      message: 'Student checked in successfully',
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark overdue passes (cron job or manual trigger)
exports.markOverdue = async (req, res) => {
  try {
    const now = new Date();
    
    const result = await NightOutPass.updateMany(
      {
        status: 'ACTIVE',
        expectedReturnDate: { $lt: now }
      },
      { status: 'OVERDUE' }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} passes as overdue`,
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const managedBlocks = req.warden ? (req.managedBlocks || getManagedBlocks(req.warden)) : null;
    const scopeQuery = managedBlocks ? buildManagedBlockScope(managedBlocks) : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      totalPending: await NightOutPass.countDocuments({ ...scopeQuery, status: 'PENDING' }),
      currentlyOut: await NightOutPass.countDocuments({ ...scopeQuery, status: 'ACTIVE' }),
      overdue: await NightOutPass.countDocuments({ ...scopeQuery, status: 'OVERDUE' }),
      todayDepartures: await NightOutPass.countDocuments({
        ...scopeQuery,
        status: { $in: ['APPROVED', 'ACTIVE'] },
        departureDate: { $gte: today, $lt: tomorrow }
      }),
      todayReturns: await NightOutPass.countDocuments({
        ...scopeQuery,
        status: 'ACTIVE',
        expectedReturnDate: { $gte: today, $lt: tomorrow }
      })
    };

    res.status(200).json({ success: true, data: stats, managedBlocks: managedBlocks || ['A', 'C', 'PG'] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
