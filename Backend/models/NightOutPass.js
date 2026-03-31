const mongoose = require('mongoose');

/**
 * Night Out Pass Model
 * Students request permission to stay out overnight or for extended periods
 */
const nightOutPassSchema = new mongoose.Schema({
  // Student info
  studentId: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  hostelBlock: {
    type: String,
    enum: ['A', 'C', 'PG', 'UNKNOWN'],
    default: 'UNKNOWN',
    index: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  parentContact: {
    type: String,
    required: true
  },

  // Pass details
  passType: {
    type: String,
    enum: ['NIGHT_OUT', 'WEEKEND', 'VACATION', 'EMERGENCY'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 300
  },
  destination: {
    type: String,
    required: true
  },
  
  // Date range
  departureDate: {
    type: Date,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  expectedReturnTime: {
    type: String,
    required: true
  },
  actualReturnDate: {
    type: Date,
    default: null
  },

  // Status
  status: {
    type: String,
    enum: [
      'PENDING',        // Awaiting approval
      'APPROVED',       // Approved by warden
      'REJECTED',       // Rejected
      'ACTIVE',         // Student has left
      'COMPLETED',      // Student returned
      'OVERDUE',        // Student hasn't returned on time
      'CANCELLED'       // Student cancelled
    ],
    default: 'PENDING'
  },

  // Approval details
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },

  // Check in/out tracking
  checkedOutAt: {
    type: Date,
    default: null
  },
  checkedOutBy: {
    type: String,
    default: null
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  checkedInBy: {
    type: String,
    default: null  // Guard name
  },

  // Additional
  emergencyContact: {
    name: { type: String, default: null },
    relation: { type: String, default: null },
    phone: { type: String, default: null }
  },
  remarks: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

nightOutPassSchema.index({ status: 1, departureDate: 1 });
nightOutPassSchema.index({ studentId: 1, status: 1 });
nightOutPassSchema.index({ hostelBlock: 1, status: 1, departureDate: 1 });

const NightOutPass = mongoose.model('NightOutPass', nightOutPassSchema);

module.exports = NightOutPass;
