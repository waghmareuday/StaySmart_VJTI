const RoomSwap = require('../models/RoomSwap');
const Application = require('../models/applicationModel');
const Room = require('../models/roomModel');
const { getAuthStudentId, getOwnedIdClause, getOwnedStudentMatchQuery, isOwnedStudentId, normalizeStudentId } = require('../utils/studentIdentity');

/**
 * Room Swap Controller
 * Handles all room swap request operations
 */

/**
 * Create a new swap request
 * POST /api/v1/swap/request
 */
exports.createSwapRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    let { requesterId: providedRequesterId, requesterName, targetId, reason } = req.body;
    providedRequesterId = normalizeStudentId(providedRequesterId);
    targetId = normalizeStudentId(targetId);
    reason = String(reason || '').trim();

    if (providedRequesterId && !isOwnedStudentId(authStudentId, providedRequesterId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only create swap requests for your own account.'
      });
    }

    if (!targetId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: targetId, reason' 
      });
    }

    // Check if requester has an allotted room
    const requesterScope = getOwnedStudentMatchQuery(authStudentId) || { studentId: authStudentId };
    const requesterApp = await Application.findOne({ 
      ...requesterScope,
      status: 'ALLOTTED' 
    }).populate('allottedRoom');

    if (!requesterApp || !requesterApp.allottedRoom) {
      return res.status(400).json({ 
        success: false, 
        message: 'You need to have an allotted room to request a swap' 
      });
    }

    const requesterId = String(requesterApp.studentId || '').trim().toUpperCase();

    if (requesterId === targetId || isOwnedStudentId(authStudentId, targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot swap with yourself!'
      });
    }

    // Check if target has an allotted room
    const targetApp = await Application.findOne({ 
      studentId: targetId, 
      status: 'ALLOTTED' 
    }).populate('allottedRoom');

    if (!targetApp || !targetApp.allottedRoom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target student does not have an allotted room' 
      });
    }

    // Check gender compatibility (can only swap within same gender blocks)
    if (requesterApp.gender !== targetApp.gender) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot swap rooms across different gender blocks' 
      });
    }

    // Check for existing pending swap request between these students
    const existingRequest = await RoomSwap.findOne({
      $or: [
        { requesterId, targetId, status: { $in: ['PENDING', 'TARGET_ACCEPTED'] } },
        { requesterId: targetId, targetId: requesterId, status: { $in: ['PENDING', 'TARGET_ACCEPTED'] } }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'A swap request already exists between you and this student' 
      });
    }

    // Check if requester already has a pending outgoing request
    const pendingOutgoing = await RoomSwap.findOne({
      requesterId,
      status: { $in: ['PENDING', 'TARGET_ACCEPTED'] }
    });

    if (pendingOutgoing) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending swap request. Cancel it first to create a new one.' 
      });
    }

    // Create the swap request
    const swapRequest = new RoomSwap({
      requesterId,
      requesterName: requesterName || requesterApp.studentId,
      requesterCurrentRoom: requesterApp.allottedRoom._id,
      requesterRoomNumber: requesterApp.allottedRoom.roomNumber,
      targetId,
      targetName: targetApp.studentId,
      targetCurrentRoom: targetApp.allottedRoom._id,
      targetRoomNumber: targetApp.allottedRoom.roomNumber,
      reason,
      status: 'PENDING'
    });

    await swapRequest.save();

    res.status(201).json({
      success: true,
      message: 'Swap request sent successfully! Waiting for target student to respond.',
      data: swapRequest
    });

  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all swap requests for a student (incoming + outgoing)
 * GET /api/v1/swap/my-requests/:studentId
 */
exports.getMySwapRequests = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const requestedStudentId = normalizeStudentId(req.params.studentId);
    if (requestedStudentId && !isOwnedStudentId(authStudentId, requestedStudentId)) {
      return res.status(403).json({ success: false, message: 'You can only access your own swap requests.' });
    }

    const requesterClause = getOwnedIdClause('requesterId', authStudentId) || { requesterId: authStudentId };
    const targetClause = getOwnedIdClause('targetId', authStudentId) || { targetId: authStudentId };

    const outgoing = await RoomSwap.find(requesterClause)
      .sort({ createdAt: -1 })
      .limit(20);

    const incoming = await RoomSwap.find(targetClause)
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        outgoing,
        incoming,
        pendingIncoming: incoming.filter(r => r.status === 'PENDING').length
      }
    });

  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Target student responds to swap request
 * POST /api/v1/swap/respond/:requestId
 */
exports.respondToSwapRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { requestId } = req.params;
    const { accept, message } = req.body;

    if (typeof accept !== 'boolean') {
      return res.status(400).json({ success: false, message: 'accept must be a boolean value.' });
    }

    const swapRequest = await RoomSwap.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (!isOwnedStudentId(authStudentId, swapRequest.targetId)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to respond to this request' });
    }

    if (swapRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request is no longer pending' });
    }

    // Check if expired
    if (new Date() > swapRequest.expiresAt) {
      swapRequest.status = 'EXPIRED';
      await swapRequest.save();
      return res.status(400).json({ success: false, message: 'This request has expired' });
    }

    swapRequest.targetResponse = {
      accepted: accept,
      respondedAt: new Date(),
      message: message || null
    };

    swapRequest.status = accept ? 'TARGET_ACCEPTED' : 'TARGET_REJECTED';
    
    if (!accept) {
      swapRequest.completedAt = new Date();
    }

    await swapRequest.save();

    res.status(200).json({
      success: true,
      message: accept 
        ? 'You accepted the swap request! Now waiting for admin approval.' 
        : 'You declined the swap request.',
      data: swapRequest
    });

  } catch (error) {
    console.error('Respond to swap error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Requester cancels their swap request
 * POST /api/v1/swap/cancel/:requestId
 */
exports.cancelSwapRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const { requestId } = req.params;

    const swapRequest = await RoomSwap.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (!isOwnedStudentId(authStudentId, swapRequest.requesterId)) {
      return res.status(403).json({ success: false, message: 'Only the requester can cancel this request' });
    }

    if (!['PENDING', 'TARGET_ACCEPTED'].includes(swapRequest.status)) {
      return res.status(400).json({ success: false, message: 'This request cannot be cancelled' });
    }

    swapRequest.status = 'CANCELLED';
    swapRequest.completedAt = new Date();
    await swapRequest.save();

    res.status(200).json({
      success: true,
      message: 'Swap request cancelled successfully',
      data: swapRequest
    });

  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all swap requests for admin
 * GET /api/v1/admin/swap-requests
 */
exports.getAllSwapRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = status ? { status } : {};
    
    const requests = await RoomSwap.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    const stats = {
      pending: await RoomSwap.countDocuments({ status: 'PENDING' }),
      awaitingAdmin: await RoomSwap.countDocuments({ status: 'TARGET_ACCEPTED' }),
      approved: await RoomSwap.countDocuments({ status: 'ADMIN_APPROVED' }),
      rejected: await RoomSwap.countDocuments({ status: { $in: ['TARGET_REJECTED', 'ADMIN_REJECTED'] } })
    };

    res.status(200).json({
      success: true,
      data: requests,
      stats
    });

  } catch (error) {
    console.error('Get all swap requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Admin approves/rejects a swap request (after both students agreed)
 * POST /api/v1/admin/swap-decision/:requestId
 */
exports.adminSwapDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approve, remarks, adminId } = req.body;

    const swapRequest = await RoomSwap.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'TARGET_ACCEPTED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only approve/reject requests where both students have agreed' 
      });
    }

    if (approve) {
      // Execute the actual room swap
      const requesterApp = await Application.findOne({ 
        studentId: swapRequest.requesterId, 
        status: 'ALLOTTED' 
      });
      const targetApp = await Application.findOne({ 
        studentId: swapRequest.targetId, 
        status: 'ALLOTTED' 
      });

      if (!requesterApp || !targetApp) {
        return res.status(400).json({ 
          success: false, 
          message: 'One or both students no longer have allotted rooms' 
        });
      }

      // Swap the room references in applications
      const tempRoom = requesterApp.allottedRoom;
      requesterApp.allottedRoom = targetApp.allottedRoom;
      targetApp.allottedRoom = tempRoom;

      // Update room occupants
      const requesterRoom = await Room.findById(swapRequest.requesterCurrentRoom);
      const targetRoom = await Room.findById(swapRequest.targetCurrentRoom);

      if (requesterRoom && targetRoom) {
        // Remove from old rooms
        requesterRoom.occupants = requesterRoom.occupants.filter(
          id => String(id).toUpperCase() !== swapRequest.requesterId
        );
        targetRoom.occupants = targetRoom.occupants.filter(
          id => String(id).toUpperCase() !== swapRequest.targetId
        );

        // Add to new rooms
        if (!requesterRoom.occupants.some(id => String(id).toUpperCase() === swapRequest.targetId)) {
          requesterRoom.occupants.push(swapRequest.targetId);
        }
        if (!targetRoom.occupants.some(id => String(id).toUpperCase() === swapRequest.requesterId)) {
          targetRoom.occupants.push(swapRequest.requesterId);
        }

        await requesterRoom.save();
        await targetRoom.save();
      }

      await requesterApp.save();
      await targetApp.save();

      swapRequest.status = 'ADMIN_APPROVED';
    } else {
      swapRequest.status = 'ADMIN_REJECTED';
    }

    swapRequest.adminDecision = {
      decidedBy: adminId || 'admin',
      decidedAt: new Date(),
      remarks: remarks || null
    };
    swapRequest.completedAt = new Date();

    await swapRequest.save();

    res.status(200).json({
      success: true,
      message: approve 
        ? 'Swap approved and executed successfully! Both students have been notified.' 
        : 'Swap request rejected.',
      data: swapRequest
    });

  } catch (error) {
    console.error('Admin swap decision error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get eligible swap targets (students with allotted rooms, same gender)
 * GET /api/v1/swap/eligible-targets/:studentId
 */
exports.getEligibleSwapTargets = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated student.' });
    }

    const requestedStudentId = normalizeStudentId(req.params.studentId);
    if (requestedStudentId && !isOwnedStudentId(authStudentId, requestedStudentId)) {
      return res.status(403).json({ success: false, message: 'You can only access your own eligible targets.' });
    }

    const requesterScope = getOwnedStudentMatchQuery(authStudentId) || { studentId: authStudentId };

    const requesterApp = await Application.findOne({ 
      ...requesterScope,
      status: 'ALLOTTED' 
    });

    if (!requesterApp) {
      return res.status(400).json({ 
        success: false, 
        message: 'You need to have an allotted room to view swap targets' 
      });
    }

    // Find all students with same gender who have allotted rooms
    const requesterId = String(requesterApp.studentId || '').trim().toUpperCase();

    const eligibleStudents = await Application.find({
      studentId: { $ne: requesterId },
      gender: requesterApp.gender,
      status: 'ALLOTTED'
    })
    .populate('allottedRoom', 'roomNumber block floor')
    .select('studentId allottedRoom gender academicYear')
    .limit(50);

    res.status(200).json({
      success: true,
      data: eligibleStudents,
      yourRoom: requesterApp.allottedRoom
    });

  } catch (error) {
    console.error('Get eligible targets error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
