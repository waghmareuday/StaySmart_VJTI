const mongoose = require('mongoose');

const wardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  assignedBlock: {
    type: String,
    enum: ['A', 'C', 'PG', 'ALL'],
    default: 'ALL'
  },
  contactNumber: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['WARDEN', 'CHIEF_WARDEN'],
    default: 'WARDEN'
  }
}, { timestamps: true });

module.exports = mongoose.model('Warden', wardenSchema);
