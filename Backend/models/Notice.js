const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    publishAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    createdBy: {
      type: String,
      default: 'admin'
    }
  },
  { timestamps: true }
);

noticeSchema.index({ isActive: 1, isPinned: -1, publishAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
