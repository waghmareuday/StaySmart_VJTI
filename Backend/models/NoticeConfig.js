const mongoose = require('mongoose');

const noticeConfigSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      required: true,
      unique: true,
      default: 'HOME_NOTICE_BOARD'
    },
    maxVisible: {
      type: Number,
      default: 3,
      min: 1,
      max: 20
    },
    updatedBy: {
      type: String,
      default: 'admin'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NoticeConfig', noticeConfigSchema);
