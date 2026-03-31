const mongoose = require('mongoose');

/**
 * Dues & Payment Model
 * Track hostel fees, mess bills, fines, and other charges
 */
const duesPaymentSchema = new mongoose.Schema({
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
    default: 'N/A'
  },

  // Due details
  dueType: {
    type: String,
    enum: ['HOSTEL_FEE', 'MESS_BILL', 'FINE', 'ELECTRICITY', 'MAINTENANCE', 'SECURITY_DEPOSIT', 'OTHER'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Timing
  dueDate: {
    type: Date,
    required: true
  },
  billingPeriod: {
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number }
  },

  // Payment status
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'WAIVED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  // Payment details (when paid)
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: function() { return this.amount; }
  },
  paymentHistory: [{
    amount: Number,
    paidAt: { type: Date, default: Date.now },
    transactionId: String,
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
      default: 'CASH'
    },
    receivedBy: String,
    remarks: String
  }],

  // Late fee
  lateFee: {
    type: Number,
    default: 0
  },
  lateFeeApplied: {
    type: Boolean,
    default: false
  },

  // Reminders
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderAt: {
    type: Date
  },

  // Admin info
  createdBy: {
    type: String,
    default: 'system'
  },
  
  // Waiver details (if waived)
  waiverReason: String,
  waivedBy: String,
  waivedAt: Date

}, { timestamps: true });

// Index for efficient queries
duesPaymentSchema.index({ studentId: 1, status: 1 });
duesPaymentSchema.index({ dueDate: 1, status: 1 });
duesPaymentSchema.index({ dueType: 1, status: 1 });

// Virtual for checking if overdue
duesPaymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'PENDING' && new Date() > this.dueDate;
});

// Method to calculate total due (including late fee)
duesPaymentSchema.methods.getTotalDue = function() {
  return this.remainingAmount + this.lateFee;
};

// Pre-save middleware to update remaining amount
duesPaymentSchema.pre('save', function(next) {
  this.remainingAmount = this.amount - this.paidAmount + this.lateFee;
  
  // Auto-update status based on payment
  if (this.paidAmount >= this.amount + this.lateFee && this.status !== 'WAIVED' && this.status !== 'CANCELLED') {
    this.status = 'PAID';
  } else if (this.paidAmount > 0 && this.paidAmount < this.amount + this.lateFee) {
    this.status = 'PARTIALLY_PAID';
  }
  
  next();
});

module.exports = mongoose.model('DuesPayment', duesPaymentSchema);
