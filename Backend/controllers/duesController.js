const DuesPayment = require('../models/DuesPayment');
const User = require('../models/AuthModel');
const nodemailer = require('nodemailer');
const { getAuthStudentId, getOwnedIdClause, isOwnedStudentId } = require('../utils/studentIdentity');

// Email transporter (Gmail with App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Dues & Payment Controller
 */

// ==================== STUDENT ENDPOINTS ====================

// Get student's dues
exports.getMyDues = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { studentId } = req.params;
    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ success: false, message: 'You can only access your own dues.' });
    }

    const { status } = req.query;

    const query = getOwnedIdClause('studentId', authStudentId) || { studentId: authStudentId };
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const dues = await DuesPayment.find(query)
      .sort({ dueDate: -1 })
      .limit(50);

    // Calculate totals
    const totalPending = dues
      .filter(d => ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(d.status))
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    const totalPaid = dues
      .filter(d => d.status === 'PAID')
      .reduce((sum, d) => sum + d.amount, 0);

    const overdueCount = dues.filter(d => 
      d.status === 'PENDING' && new Date() > new Date(d.dueDate)
    ).length;

    res.status(200).json({
      success: true,
      data: dues,
      summary: {
        totalPending,
        totalPaid,
        overdueCount,
        totalDues: dues.length
      }
    });
  } catch (error) {
    console.error('Get dues error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get payment history for a specific due
exports.getPaymentHistory = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { dueId } = req.params;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    if (!isOwnedStudentId(authStudentId, due.studentId)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this due.' });
    }

    res.status(200).json({
      success: true,
      data: {
        due,
        payments: due.paymentHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Record a payment (student-initiated, pending admin confirmation)
exports.recordPayment = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { dueId } = req.params;
    const { amount, transactionId, paymentMethod, remarks } = req.body;

    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    if (!isOwnedStudentId(authStudentId, due.studentId)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pay this due.' });
    }

    if (due.status === 'PAID' || due.status === 'CANCELLED' || due.status === 'WAIVED') {
      return res.status(400).json({ success: false, message: 'This due is already settled' });
    }

    if (amountNumber > Number(due.remainingAmount || 0)) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds remaining due' });
    }

    const sanitizedTransactionId = String(transactionId || '').trim();

    // Add payment to history
    due.paymentHistory.push({
      amount: amountNumber,
      transactionId: sanitizedTransactionId || `TXN${Date.now()}`,
      paymentMethod: paymentMethod || 'UPI',
      remarks: remarks || 'Student payment',
      paidAt: new Date()
    });

    due.paidAmount += amountNumber;
    await due.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully!',
      data: due
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Create a due for a single student
exports.createDue = async (req, res) => {
  try {
    const { studentId, studentName, roomNumber, dueType, title, description, amount, dueDate, billingPeriod, createdBy } = req.body;

    if (!studentId || !dueType || !title || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const due = new DuesPayment({
      studentId,
      studentName: studentName || studentId,
      roomNumber: roomNumber || 'N/A',
      dueType,
      title,
      description: description || '',
      amount,
      remainingAmount: amount,
      dueDate: new Date(dueDate),
      billingPeriod: billingPeriod || null,
      createdBy: createdBy || 'admin'
    });

    await due.save();

    res.status(201).json({
      success: true,
      message: 'Due created successfully!',
      data: due
    });
  } catch (error) {
    console.error('Create due error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create bulk dues (for all students or filtered)
exports.createBulkDues = async (req, res) => {
  try {
    const { studentIds, dueType, title, description, amount, dueDate, billingPeriod } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No students selected' });
    }

    if (!dueType || !title || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const dues = studentIds.map(student => ({
      studentId: student.studentId,
      studentName: student.studentName || student.studentId,
      roomNumber: student.roomNumber || 'N/A',
      dueType,
      title,
      description: description || '',
      amount,
      remainingAmount: amount,
      dueDate: new Date(dueDate),
      billingPeriod: billingPeriod || null,
      createdBy: 'admin'
    }));

    const result = await DuesPayment.insertMany(dues);

    res.status(201).json({
      success: true,
      message: `Created ${result.length} dues successfully!`,
      count: result.length
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all dues (admin)
exports.getAllDues = async (req, res) => {
  try {
    const { status, dueType, studentId, overdue } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (dueType && dueType !== 'ALL') query.dueType = dueType;
    if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
    
    // Filter overdue only
    if (overdue === 'true') {
      query.status = 'PENDING';
      query.dueDate = { $lt: new Date() };
    }

    const dues = await DuesPayment.find(query)
      .sort({ dueDate: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      data: dues,
      count: dues.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get dues statistics
exports.getDueStats = async (req, res) => {
  try {
    const now = new Date();

    const stats = {
      totalPending: await DuesPayment.countDocuments({ status: 'PENDING' }),
      totalOverdue: await DuesPayment.countDocuments({ status: 'PENDING', dueDate: { $lt: now } }),
      totalPaid: await DuesPayment.countDocuments({ status: 'PAID' }),
      partiallyPaid: await DuesPayment.countDocuments({ status: 'PARTIALLY_PAID' }),
    };

    // Calculate amounts
    const pendingDues = await DuesPayment.find({ 
      status: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } 
    });
    stats.pendingAmount = pendingDues.reduce((sum, d) => sum + d.remainingAmount, 0);

    const paidDues = await DuesPayment.find({ status: 'PAID' });
    stats.collectedAmount = paidDues.reduce((sum, d) => sum + d.amount, 0);

    // By type breakdown
    const byType = await DuesPayment.aggregate([
      { $match: { status: { $in: ['PENDING', 'PARTIALLY_PAID'] } } },
      { $group: { _id: '$dueType', count: { $sum: 1 }, total: { $sum: '$remainingAmount' } } }
    ]);
    stats.byType = byType;

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin record/confirm payment
exports.adminRecordPayment = async (req, res) => {
  try {
    const { dueId } = req.params;
    const { amount, transactionId, paymentMethod, receivedBy, remarks } = req.body;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    due.paymentHistory.push({
      amount,
      transactionId: transactionId || `ADMIN${Date.now()}`,
      paymentMethod: paymentMethod || 'CASH',
      receivedBy: receivedBy || 'Admin',
      remarks: remarks || 'Admin recorded payment',
      paidAt: new Date()
    });

    due.paidAmount += amount;
    await due.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded!',
      data: due
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Apply late fee
exports.applyLateFee = async (req, res) => {
  try {
    const { dueId } = req.params;
    const { lateFee } = req.body;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    due.lateFee = lateFee || 0;
    due.lateFeeApplied = true;
    await due.save();

    res.status(200).json({
      success: true,
      message: `Late fee of ₹${lateFee} applied`,
      data: due
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Waive a due
exports.waiveDue = async (req, res) => {
  try {
    const { dueId } = req.params;
    const { waiverReason, waivedBy } = req.body;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    due.status = 'WAIVED';
    due.waiverReason = waiverReason || 'Admin waiver';
    due.waivedBy = waivedBy || 'Admin';
    due.waivedAt = new Date();
    due.remainingAmount = 0;
    await due.save();

    res.status(200).json({
      success: true,
      message: 'Due waived successfully',
      data: due
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark overdue (batch update)
exports.markOverdue = async (req, res) => {
  try {
    const now = new Date();

    const result = await DuesPayment.updateMany(
      { status: 'PENDING', dueDate: { $lt: now } },
      { status: 'OVERDUE' }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} dues as overdue`,
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send payment reminder email
exports.sendReminder = async (req, res) => {
  try {
    const { dueId } = req.params;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    const parsedStudentId = Number(due.studentId);
    const user = Number.isFinite(parsedStudentId)
      ? await User.findOne({ collegeId: parsedStudentId }).select('email')
      : null;

    const recipientEmail = user?.email;
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No student email found for this due. Cannot send reminder.'
      });
    }

    const remainingAmount = due.amount + (due.lateFee || 0) - due.paidAmount;
    
    // Send actual email
    await transporter.sendMail({
      from: `"VJTI Hostel Finance" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `💰 Payment Reminder - ${due.dueType.replace('_', ' ')} Due`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Payment Reminder</h2>
          <p>Dear <strong>${due.studentName}</strong>,</p>
          <p>This is a reminder that you have a pending payment:</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Due Type:</strong> ${due.dueType.replace('_', ' ')}</p>
            <p><strong>Description:</strong> ${due.description || 'N/A'}</p>
            <p><strong>Due Date:</strong> ${new Date(due.dueDate).toDateString()}</p>
            <p><strong>Remaining Amount:</strong> ₹${remainingAmount}</p>
            ${due.lateFee > 0 ? `<p style="color: #dc2626;"><strong>Late Fee:</strong> ₹${due.lateFee}</p>` : ''}
          </div>
          <p>Please make the payment at the earliest to avoid additional late fees.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">VJTI Hostel Management System - Automated Reminder</p>
        </div>
      `
    });

    due.remindersSent += 1;
    due.lastReminderAt = new Date();
    await due.save();

    res.status(200).json({
      success: true,
      message: `Reminder email sent to ${recipientEmail}!`,
      reminderCount: due.remindersSent
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ success: false, message: 'Failed to send reminder email' });
  }
};

// Delete a due
exports.deleteDue = async (req, res) => {
  try {
    const { dueId } = req.params;

    const due = await DuesPayment.findById(dueId);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due not found' });
    }

    if (due.paidAmount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete due with payments' });
    }

    await DuesPayment.findByIdAndDelete(dueId);

    res.status(200).json({
      success: true,
      message: 'Due deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
