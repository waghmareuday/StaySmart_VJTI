const mongoose = require('mongoose');

const messOffSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    approvedDays: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    }
  },
  { timestamps: true }
);

messOffSchema.index({ studentId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('MessOff', messOffSchema);
