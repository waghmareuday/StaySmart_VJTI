const mongoose = require('mongoose');

/**
 * Maintenance Request Model
 * Students can report room/facility issues for repair
 */
const maintenanceSchema = new mongoose.Schema({
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
  contactNumber: {
    type: String,
    default: 'N/A'
  },
  location: {
    type: String,
    default: ''
  },

  // Issue details
  category: {
    type: String,
    enum: ['ELECTRICAL', 'PLUMBING', 'FURNITURE', 'CIVIL', 'CLEANING', 'AC_COOLER', 'PEST_CONTROL', 'INTERNET', 'OTHER'],
    required: true
  },
  issueTitle: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  urgency: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  imageUrl: {
    type: String,
    default: null
  },

  // Status tracking
  status: {
    type: String,
    enum: [
      'SUBMITTED',      // Just submitted
      'ACKNOWLEDGED',   // Admin seen it
      'IN_PROGRESS',    // Work started
      'RESOLVED',       // Fixed
      'CLOSED',         // Student confirmed closure
      'REJECTED'        // Invalid/duplicate request
    ],
    default: 'SUBMITTED'
  },

  // Admin response
  assignedTo: {
    type: String,
    default: null
  },
  priority: {
    type: Number,
    default: 0,  // 0 = not set, 1 = lowest, 5 = highest
    min: 0,
    max: 5
  },
  adminRemarks: {
    type: String,
    default: null
  },
  estimatedCompletion: {
    type: Date,
    default: null
  },

  // Resolution
  resolutionNotes: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  studentRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  studentFeedback: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

maintenanceSchema.index({ status: 1, createdAt: -1 });
maintenanceSchema.index({ category: 1, status: 1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;
