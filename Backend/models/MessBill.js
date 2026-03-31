const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2000
    },
    baseFee: {
      type: Number,
      required: true,
      min: 0
    },
    messOffRebate: {
      type: Number,
      default: 0,
      min: 0
    },
    arrears: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDue: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFICATION', 'PAID'],
      default: 'PENDING',
      index: true
    },
    utrNumber: {
      type: String,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

messBillSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

messBillSchema.pre('validate', function(next) {
  if (this.totalDue == null) {
    this.totalDue = (this.baseFee || 0) - (this.messOffRebate || 0) + (this.arrears || 0);
  }
  if (this.totalDue < 0) {
    this.totalDue = 0;
  }
  next();
});

module.exports = mongoose.model('MessBill', messBillSchema);