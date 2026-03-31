// models/applicationModel.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  academicYear: { type: String, enum: ['FY', 'SY', 'TY', 'BTech'], required: true },
  gender: { type: String, enum: ['M', 'F'], required: true },

  // FY Specific
  mhtCetRank: { type: Number },

  // Distance Logic
  homePincode: { type: String, required: true },
  distanceFromCollege: { type: Number },

  // Senior Roommate Logic - Now tracks bidirectional requests
  requestedRoommateId: { type: String, default: null, uppercase: true, trim: true },
  roommateAcceptedBy: { type: String, default: null, uppercase: true, trim: true }, // Who accepted this request

  // The State Machine (improved)
  status: {
    type: String,
    enum: [
      'PENDING',               // Just submitted
      'REJECTED_DISTANCE',     // Failed the 50km rule
      'WAITING_FOR_PARTNER',   // Senior requested a roommate, waiting for them to accept
      'READY_FOR_ALLOTMENT',   // Ready to be processed by the algorithm (Single or Matched)
      'ALLOTTED'               // Successfully got a room
    ],
    default: 'PENDING'
  },

  allottedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  allotmentRound: { type: Number, default: null }, // Track which allocation round they were allotted in
  isProcessed: { type: Boolean, default: false } // Track if student was included in latest allocation
}, { timestamps: true });

// Note: We only need either unique:true on field OR schema.index(), not both
// The unique:true on studentId field already creates an index, so we remove the separate index

module.exports = mongoose.model('Application', applicationSchema);