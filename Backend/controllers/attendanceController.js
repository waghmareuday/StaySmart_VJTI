const Attendance = require('../models/Attendance');
const Application = require('../models/applicationModel');
const Room = require('../models/roomModel');
const NightOutPass = require('../models/NightOutPass');
const HostelLeaving = require('../models/HostelLeaving');
const User = require('../models/AuthModel');
const nodemailer = require('nodemailer');
const { canAccessBlock, getManagedBlocks } = require('../utils/wardenAccess');

// Email transporter (Gmail with App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️ Email transporter error:', error.message);
  } else {
    console.log('✅ Email server ready to send messages');
  }
});

const CHIEF_WARDEN_EMAIL = process.env.CHIEF_WARDEN_EMAIL || 'chiefwarden@vjti.ac.in';

/**
 * GET /api/attendance/rooms/:block
 * Get all rooms with students for a specific block (for warden's mobile UI)
 * Pre-marks approved leaves in green
 */
exports.getRoomsForAttendance = async (req, res) => {
  try {
    const requestedBlock = String(req.params.block || '').trim().toUpperCase();
    const managedBlocks = req.managedBlocks || getManagedBlocks(req.warden);

    if (!canAccessBlock(req.warden, requestedBlock)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for block ${requestedBlock}. Allowed blocks: ${managedBlocks.join(', ') || 'none'}`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all rooms in this block with occupants
    const rooms = await Room.find({ 
      block: requestedBlock,
      occupants: { $exists: true, $ne: [] }
    }).sort({ floor: 1, roomNumber: 1 });

    // Treat approved and currently active night-out passes as excused for attendance.
    const approvedPasses = await NightOutPass.find({
      status: { $in: ['APPROVED', 'ACTIVE'] },
      departureDate: { $lte: tomorrow },
      expectedReturnDate: { $gte: today }
    });
    const passedStudents = new Set(approvedPasses.map(p => p.studentId.toUpperCase()));

    // Get recent hostel leaving forms (students who left in last 30 days)
    // These forms are for permanent hostel leaving, not temporary absence
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leavingForms = await HostelLeaving.find({
      dateOfDeparture: { $gte: thirtyDaysAgo, $lte: tomorrow }
    });
    const leavingStudents = new Set(leavingForms.map(f => f.rollNo?.toString()));

    // Build the room-wise student list
    const roomsWithStudents = await Promise.all(rooms.map(async (room) => {
      // Get application details for each occupant
      const studentsData = await Promise.all(room.occupants.map(async (studentId) => {
        const application = await Application.findOne({ studentId: studentId.toUpperCase() });
        
        // Safely parse collegeId - only use if it's a valid number
        const parsedCollegeId = parseInt(studentId);
        const collegeIdQuery = !isNaN(parsedCollegeId) ? { collegeId: parsedCollegeId } : null;
        
        const user = await User.findOne({ 
          $or: [
            ...(collegeIdQuery ? [collegeIdQuery] : []),
            { email: { $regex: studentId, $options: 'i' } }
          ]
        });

        // Check if student has approved leave
        const hasApprovedLeave = passedStudents.has(studentId.toUpperCase()) || 
                                 leavingStudents.has(studentId);

        // Get the night out pass details if exists
        let leaveDetails = null;
        if (hasApprovedLeave) {
          const pass = approvedPasses.find(p => p.studentId.toUpperCase() === studentId.toUpperCase());
          if (pass) {
            leaveDetails = {
              type: pass.passType,
              returnDate: pass.expectedReturnDate,
              destination: pass.destination
            };
          }
        }

        return {
          studentId: studentId.toUpperCase(),
          name: user?.name || application?.studentId || studentId,
          email: user?.email || `${studentId.toLowerCase()}@vjti.ac.in`,
          contact: user?.mobileNo || '',
          status: hasApprovedLeave ? 'ON_APPROVED_LEAVE' : 'PRESENT', // Default to PRESENT!
          leaveDetails,
          canMarkAbsent: !hasApprovedLeave // Cannot mark absent if on approved leave
        };
      }));

      return {
        roomNumber: room.roomNumber,
        block: room.block,
        floor: room.floor,
        capacity: room.capacity,
        students: studentsData.filter(s => s.studentId) // Filter out nulls
      };
    }));

    // Group by floor for easier navigation
    const byFloor = roomsWithStudents.reduce((acc, room) => {
      const floor = room.floor || 0;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(room);
      return acc;
    }, {});

    res.json({
      success: true,
      block: requestedBlock,
      managedBlocks,
      date: today.toISOString().split('T')[0],
      totalRooms: roomsWithStudents.length,
      totalStudents: roomsWithStudents.reduce((sum, r) => sum + r.students.length, 0),
      studentsOnLeave: roomsWithStudents.reduce((sum, r) => 
        sum + r.students.filter(s => s.status === 'ON_APPROVED_LEAVE').length, 0),
      byFloor,
      rooms: roomsWithStudents
    });
  } catch (error) {
    console.error('Error getting rooms for attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/attendance/submit
 * Submit attendance - ONLY saves absent students (the smart part!)
 * Automatically calculates escalation levels
 */
exports.submitAttendance = async (req, res) => {
  try {
    const { block, absentStudents, checkTime = "22:00" } = req.body;
    const normalizedBlock = String(block || '').trim().toUpperCase();
    const managedBlocks = req.managedBlocks || getManagedBlocks(req.warden);
    const markedBy = req.warden?.email || 'warden@vjti.ac.in';

    if (!normalizedBlock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Block is required' 
      });
    }

    if (!canAccessBlock(req.warden, normalizedBlock)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for block ${normalizedBlock}. Allowed blocks: ${managedBlocks.join(', ') || 'none'}`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If no absences, just log the successful check
    if (!absentStudents || absentStudents.length === 0) {
      return res.json({
        success: true,
        message: `All students present in Block ${normalizedBlock}! No absences recorded.`,
        absencesRecorded: 0,
        date: today.toISOString().split('T')[0]
      });
    }

    const savedRecords = [];
    const escalationSummary = { strike1: 0, strike2: 0 };

    for (const student of absentStudents) {
      // Check if this student was absent yesterday (for escalation)
      const wasAbsentYesterday = await Attendance.wasAbsentYesterday(student.studentId);
      
      // Check existing absence record for today (avoid duplicates)
      const existingRecord = await Attendance.findOne({
        studentId: student.studentId.toUpperCase(),
        date: today
      });

      if (existingRecord) {
        continue; // Already recorded today
      }

      // Calculate escalation level
      let escalationLevel = 1;
      if (wasAbsentYesterday) {
        escalationLevel = 2;
        escalationSummary.strike2++;
      } else {
        escalationSummary.strike1++;
      }

      const record = new Attendance({
        date: today,
        studentId: student.studentId.toUpperCase(),
        studentName: student.name || student.studentId,
        studentEmail: student.email || `${student.studentId.toLowerCase()}@vjti.ac.in`,
        roomNumber: student.roomNumber,
        hostelBlock: normalizedBlock,
        floor: student.floor,
        escalationLevel,
        markedBy,
        checkTime,
        remarks: student.remarks || ''
      });

      await record.save();
      savedRecords.push(record);
    }

    res.json({
      success: true,
      message: `Attendance submitted for Block ${normalizedBlock}`,
      date: today.toISOString().split('T')[0],
      absencesRecorded: savedRecords.length,
      escalationSummary,
      records: savedRecords
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/attendance/dispatch-alerts
 * The "One-Click" alert dispatch - sends emails based on escalation level
 */
exports.dispatchAlerts = async (req, res) => {
  try {
    const { date } = req.body;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all absences for this date that haven't had alerts sent
    const pendingAlerts = await Attendance.find({
      date: { $gte: targetDate, $lte: endOfDay },
      alertSent: false
    });

    if (pendingAlerts.length === 0) {
      return res.json({
        success: true,
        message: 'No pending alerts to dispatch',
        alertsSent: 0
      });
    }

    const results = { strike1Sent: 0, strike2Sent: 0, failed: 0 };

    for (const record of pendingAlerts) {
      try {
        if (record.escalationLevel === 1) {
          // STRIKE 1: Friendly email to student only
          await transporter.sendMail({
            from: `"VJTI Hostel" <${process.env.SMTP_USER}>`,
            to: record.studentEmail,
            subject: '⚠️ Attendance Alert - You Were Marked Absent',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Attendance Notice</h2>
                <p>Dear <strong>${record.studentName}</strong>,</p>
                <p>You were marked <strong>absent</strong> during the ${record.checkTime} attendance check on <strong>${targetDate.toDateString()}</strong>.</p>
                <p><strong>Room:</strong> ${record.roomNumber}, Block ${record.hostelBlock}</p>
                <p style="color: #666;">If you believe this is an error, please contact the warden immediately with valid proof of your presence.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">This is an automated message from VJTI Hostel Management System.</p>
              </div>
            `
          });
          results.strike1Sent++;
        } else if (record.escalationLevel >= 2) {
          // STRIKE 2: High priority email to student + CC Chief Warden
          await transporter.sendMail({
            from: `"VJTI Hostel - URGENT" <${process.env.SMTP_USER}>`,
            to: record.studentEmail,
            cc: CHIEF_WARDEN_EMAIL,
            subject: '🚨 URGENT: Consecutive Absence Alert - Immediate Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; padding: 20px;">
                <h2 style="color: #dc2626;">⚠️ CONSECUTIVE ABSENCE WARNING</h2>
                <p>Dear <strong>${record.studentName}</strong>,</p>
                <p>You have been marked <strong>absent for consecutive days</strong>. This is a serious matter.</p>
                <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Date:</strong> ${targetDate.toDateString()}</p>
                  <p><strong>Room:</strong> ${record.roomNumber}, Block ${record.hostelBlock}</p>
                  <p><strong>Escalation Level:</strong> Strike ${record.escalationLevel}</p>
                </div>
                <p style="color: #dc2626; font-weight: bold;">You are required to report to the Warden's office within 24 hours with a valid explanation.</p>
                <p>The Chief Warden has been notified of this incident.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">VJTI Hostel Management System - Automated Alert</p>
              </div>
            `
          });
          record.chiefWardenNotified = true;
          results.strike2Sent++;
        }

        // Update record
        record.alertSent = true;
        record.alertSentAt = new Date();
        await record.save();
      } catch (emailError) {
        console.error(`Failed to send email to ${record.studentEmail}:`, emailError);
        results.failed++;
      }
    }

    res.json({
      success: true,
      message: 'Alerts dispatched successfully',
      date: targetDate.toISOString().split('T')[0],
      summary: results,
      totalProcessed: pendingAlerts.length
    });
  } catch (error) {
    console.error('Error dispatching alerts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/attendance/report/:date
 * Generate the "Nightly Exception Report"
 */
exports.getExceptionReport = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const absences = await Attendance.find({
      date: { $gte: targetDate, $lte: endOfDay }
    }).sort({ hostelBlock: 1, roomNumber: 1 });

    // Group by block
    const byBlock = absences.reduce((acc, record) => {
      const block = record.hostelBlock;
      if (!acc[block]) acc[block] = [];
      acc[block].push({
        studentId: record.studentId,
        name: record.studentName,
        email: record.studentEmail,
        room: record.roomNumber,
        floor: record.floor,
        escalationLevel: record.escalationLevel,
        alertSent: record.alertSent,
        markedBy: record.markedBy,
        remarks: record.remarks
      });
      return acc;
    }, {});

    const strike1Count = absences.filter(a => a.escalationLevel === 1).length;
    const strike2Count = absences.filter(a => a.escalationLevel >= 2).length;
    const alertsPending = absences.filter(a => !a.alertSent).length;

    res.json({
      success: true,
      report: {
        title: 'Nightly Exception Report',
        date: targetDate.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        summary: {
          totalAbsent: absences.length,
          strike1: strike1Count,
          strike2: strike2Count,
          alertsPending
        },
        byBlock,
        allAbsences: absences
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/attendance/chronic-absentees
 * Get students with >3 absences this month (for Admin Dashboard widget)
 */
exports.getChronicAbsentees = async (req, res) => {
  try {
    const { threshold = 3 } = req.query;
    const chronicAbsentees = await Attendance.getChronicAbsentees(parseInt(threshold));

    res.json({
      success: true,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      threshold: parseInt(threshold),
      count: chronicAbsentees.length,
      absentees: chronicAbsentees
    });
  } catch (error) {
    console.error('Error getting chronic absentees:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/attendance/student/:studentId
 * Get attendance history for a specific student
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { months = 3 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    startDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      studentId: studentId.toUpperCase(),
      date: { $gte: startDate }
    }).sort({ date: -1 });

    const monthlyCount = await Attendance.getMonthlyAbsenceCount(studentId.toUpperCase());

    res.json({
      success: true,
      studentId: studentId.toUpperCase(),
      totalAbsences: records.length,
      thisMonthAbsences: monthlyCount,
      isChronic: monthlyCount > 3,
      records
    });
  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/attendance/stats
 * Get overall attendance statistics (for Admin Dashboard)
 */
exports.getAttendanceStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get various counts
    const [todayAbsences, weekAbsences, monthAbsences, chronicAbsentees] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: today, $lte: endOfToday } }),
      Attendance.countDocuments({ date: { $gte: startOfWeek } }),
      Attendance.countDocuments({ date: { $gte: startOfMonth } }),
      Attendance.getChronicAbsentees(3)
    ]);

    // Get pending alerts count
    const pendingAlerts = await Attendance.countDocuments({
      date: { $gte: today, $lte: endOfToday },
      alertSent: false
    });

    // Get absences by block for today
    const byBlock = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lte: endOfToday } } },
      { $group: { _id: '$hostelBlock', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        today: {
          absences: todayAbsences,
          pendingAlerts,
          byBlock: byBlock.reduce((acc, b) => ({ ...acc, [b._id]: b.count }), {})
        },
        thisWeek: weekAbsences,
        thisMonth: monthAbsences,
        chronicAbsenteesCount: chronicAbsentees.length
      }
    });
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/attendance/:id
 * Delete an attendance record (in case of error)
 */
exports.deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted',
      deletedRecord: record
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/attendance/blocks
 * Get list of blocks that have rooms (for warden to select)
 */
exports.getBlocks = async (req, res) => {
  try {
    const blocks = await Room.distinct('block');
    const managedBlocks = req.managedBlocks || getManagedBlocks(req.warden);
    
    // If no blocks found, return default blocks
    const defaultBlocks = blocks.length > 0 ? blocks : ['A', 'C', 'PG'];
    const visibleBlocks = defaultBlocks.filter((block) => managedBlocks.includes(String(block).toUpperCase()));
    
    // Get count of rooms and students per block
    const blockStats = await Promise.all(visibleBlocks.map(async (block) => {
      const allRooms = await Room.find({ block });
      const occupiedRooms = await Room.find({ block, occupants: { $exists: true, $ne: [] } });
      const studentCount = occupiedRooms.reduce((sum, r) => sum + (r.occupants?.length || 0), 0);
      return {
        block,
        totalRooms: allRooms.length,
        roomCount: occupiedRooms.length,
        studentCount
      };
    }));

    res.json({
      success: true,
      blocks: blockStats,
      managedBlocks
    });
  } catch (error) {
    console.error('Error getting blocks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
