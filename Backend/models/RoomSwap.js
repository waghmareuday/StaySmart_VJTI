const mongoose = require('mongoose');

/**
 * Room Swap Request Model
 * Allows students to request swapping rooms with another student
 * Requires both students to agree before admin can approve
 */
const roomSwapSchema = new mongoose.Schema({
  // Requester (Student A who initiates the swap)
  requesterId: {
    type: String,
    required: true,
    index: true
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterCurrentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  requesterRoomNumber: {
    type: String,
    required: true
  },

  // Target (Student B who is being asked to swap)
  targetId: {
    type: String,
    required: true,
    index: true
  },
  targetName: {
    type: String,
    default: null
  },
  targetCurrentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  targetRoomNumber: {
    type: String,
    required: true
  },

  // Reason for swap request
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Status workflow: PENDING -> TARGET_ACCEPTED/TARGET_REJECTED -> ADMIN_APPROVED/ADMIN_REJECTED
  status: {
    type: String,
    enum: [
      'PENDING',           // Waiting for target student response
      'TARGET_ACCEPTED',   // Target agreed, waiting for admin
      'TARGET_REJECTED',   // Target declined the swap
      'ADMIN_APPROVED',    // Admin approved, swap executed
      'ADMIN_REJECTED',    // Admin rejected despite both agreeing
      'CANCELLED',         // Requester cancelled
      'EXPIRED'            // Request expired after 7 days
    ],
    default: 'PENDING'
  },

  // Target student's response
  targetResponse: {
    accepted: { type: Boolean, default: null },
    respondedAt: { type: Date, default: null },
    message: { type: String, default: null }
  },

  // Admin's decision
  adminDecision: {
    decidedBy: { type: String, default: null },
    decidedAt: { type: Date, default: null },
    remarks: { type: String, default: null }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Index for quick lookups
roomSwapSchema.index({ status: 1, createdAt: -1 });
roomSwapSchema.index({ requesterId: 1, status: 1 });
roomSwapSchema.index({ targetId: 1, status: 1 });

const RoomSwap = mongoose.model('RoomSwap', roomSwapSchema);

module.exports = RoomSwap;
