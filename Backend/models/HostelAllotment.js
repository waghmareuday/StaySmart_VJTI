const mongoose = require('mongoose');

const hostelAllotmentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  roomType: { type: String, required: true },
  arrivalDate: { type: Date, required: true },
  contact: { type: Number, required: true },
  reason: { type: String, required: true },
  alloted: { type: Boolean, default: false },
},{
  timestamps: true
}

);

const hostelAllotment = mongoose.model('HostelAllotment', hostelAllotmentSchema);

module.exports= hostelAllotment;