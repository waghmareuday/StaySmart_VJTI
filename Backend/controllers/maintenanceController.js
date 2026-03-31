const Maintenance = require('../models/Maintenance');
const { getAuthStudentId, getOwnedIdClause, isOwnedStudentId } = require('../utils/studentIdentity');

/**
 * Maintenance Request Controller
 */

// Create a new maintenance request (Student)
exports.createRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { studentId: providedStudentId, studentName, roomNumber, contactNumber, category, issueTitle, title, description, urgency, imageUrl, location } = req.body;

    if (providedStudentId && !isOwnedStudentId(authStudentId, providedStudentId)) {
      return res.status(403).json({ success: false, message: 'You can only create requests for your own account.' });
    }

    const studentId = authStudentId;

    // Accept either issueTitle or title from frontend
    const finalTitle = issueTitle || title;
    // Accept location as additional info, roomNumber is user's room
    const finalRoomNumber = roomNumber || 'Unknown';

    if (!studentId || !category || !finalTitle || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check for recent duplicate request
    const recentDuplicate = await Maintenance.findOne({
      studentId,
      roomNumber: finalRoomNumber,
      category,
      status: { $in: ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within 24 hours
    });

    if (recentDuplicate) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a similar pending request. Please wait for it to be resolved.' 
      });
    }

    const request = new Maintenance({
      studentId,
      studentName: studentName || studentId,
      roomNumber: finalRoomNumber,
      contactNumber: contactNumber || 'N/A',
      category,
      issueTitle: finalTitle,
      description,
      location: location || finalRoomNumber,
      urgency: urgency || 'MEDIUM',
      imageUrl: imageUrl || null
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully!',
      data: request
    });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get student's maintenance requests
exports.getMyRequests = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { studentId } = req.params;

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ success: false, message: 'You can only access your own requests.' });
    }

    const ownedStudentClause = getOwnedIdClause('studentId', authStudentId) || { studentId: authStudentId };

    const requests = await Maintenance.find(ownedStudentClause)
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Student rates/closes a resolved request
exports.closeRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { requestId } = req.params;
    const { rating, feedback } = req.body;

    const request = await Maintenance.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!isOwnedStudentId(authStudentId, request.studentId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Request must be resolved first' });
    }

    const ratingValue = rating == null || rating === '' ? null : Number(rating);
    if (ratingValue != null && (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    request.status = 'CLOSED';
    request.studentRating = ratingValue;
    request.studentFeedback = feedback || null;
    request.updatedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request closed. Thank you for your feedback!',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Get all maintenance requests (Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const { status, category, urgency } = req.query;

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (category && category !== 'ALL') query.category = category;
    if (urgency && urgency !== 'ALL') query.urgency = urgency;

    const requests = await Maintenance.find(query)
      .sort({ 
        priority: -1, 
        urgency: -1,
        createdAt: -1 
      })
      .limit(100);

    const stats = {
      total: await Maintenance.countDocuments(),
      submitted: await Maintenance.countDocuments({ status: 'SUBMITTED' }),
      inProgress: await Maintenance.countDocuments({ status: 'IN_PROGRESS' }),
      resolved: await Maintenance.countDocuments({ status: 'RESOLVED' }),
      avgRating: await Maintenance.aggregate([
        { $match: { studentRating: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$studentRating' } } }
      ]).then(r => r[0]?.avg?.toFixed(1) || 'N/A')
    };

    res.status(200).json({ success: true, data: requests, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update maintenance request status (Admin)
exports.updateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, assignedTo, priority, adminRemarks, estimatedCompletion, resolutionNotes } = req.body;

    const request = await Maintenance.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (status) request.status = status;
    if (assignedTo !== undefined) request.assignedTo = assignedTo;
    if (priority !== undefined) request.priority = priority;
    if (adminRemarks !== undefined) request.adminRemarks = adminRemarks;
    if (estimatedCompletion) request.estimatedCompletion = new Date(estimatedCompletion);
    if (resolutionNotes !== undefined) request.resolutionNotes = resolutionNotes;

    if (status === 'RESOLVED') {
      request.resolvedAt = new Date();
    }

    request.updatedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get maintenance stats by category (Admin dashboard)
exports.getStats = async (req, res) => {
  try {
    const categoryStats = await Maintenance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const statusStats = await Maintenance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const avgResolutionTime = await Maintenance.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $project: {
        resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
      }},
      { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } }
    ]).then(r => {
      if (r[0]?.avgTime) {
        const hours = Math.round(r[0].avgTime / (1000 * 60 * 60));
        return `${hours} hours`;
      }
      return 'N/A';
    });

    res.status(200).json({
      success: true,
      data: {
        byCategory: categoryStats,
        byStatus: statusStats,
        avgResolutionTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
