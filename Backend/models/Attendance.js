const mongoose = require("mongoose");

// Only stores ABSENT students - this is the key efficiency!
const AttendanceRecordSchema = new mongoose.Schema({
  // The date of attendance check
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Student who was absent
  studentId: {
    type: String,
    required: true,
    index: true
  },
  
  studentName: {
    type: String,
    required: true
  },
  
  studentEmail: {
    type: String,
    required: true
  },
  
  // Room details for quick reporting
  roomNumber: {
    type: String,
    required: true
  },
  
  hostelBlock: {
    type: String,
    required: true
  },
  
  floor: {
    type: Number
  },
  
  // Escalation tracking
  escalationLevel: {
    type: Number,
    default: 1,  // 1 = first absence (friendly email), 2 = consecutive (CC chief warden)
    min: 1,
    max: 3
  },
  
  // Was alert sent?
  alertSent: {
    type: Boolean,
    default: false
  },
  
  alertSentAt: {
    type: Date
  },
  
  // Chief warden notified?
  chiefWardenNotified: {
    type: Boolean,
    default: false
  },
  
  // Warden who marked this
  markedBy: {
    type: String,  // Warden's email or ID
    required: true
  },
  
  // Notes from warden
  remarks: {
    type: String,
    default: ""
  },
  
  // Time of check (10 PM check, etc.)
  checkTime: {
    type: String,
    default: "22:00"  // Default 10 PM
  }
}, { timestamps: true });

// Compound index for efficient queries
AttendanceRecordSchema.index({ date: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ studentId: 1, date: -1 });
AttendanceRecordSchema.index({ hostelBlock: 1, date: 1 });

// Static method to get absence count for a student in current month
AttendanceRecordSchema.statics.getMonthlyAbsenceCount = async function(studentId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  
  return await this.countDocuments({
    studentId,
    date: { $gte: startOfMonth, $lt: endOfMonth }
  });
};

// Static method to check if student was absent yesterday (for escalation)
AttendanceRecordSchema.statics.wasAbsentYesterday = async function(studentId) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);
  
  const record = await this.findOne({
    studentId,
    date: { $gte: yesterday, $lte: endOfYesterday }
  });
  
  return !!record;
};

// Static method to get chronic absentees (>3 absences this month)
AttendanceRecordSchema.statics.getChronicAbsentees = async function(threshold = 3) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  return await this.aggregate([
    { $match: { date: { $gte: startOfMonth } } },
    { 
      $group: { 
        _id: "$studentId",
        studentName: { $first: "$studentName" },
        studentEmail: { $first: "$studentEmail" },
        roomNumber: { $first: "$roomNumber" },
        hostelBlock: { $first: "$hostelBlock" },
        absenceCount: { $sum: 1 },
        lastAbsent: { $max: "$date" },
        absenceDates: { $push: "$date" }
      } 
    },
    { $match: { absenceCount: { $gt: threshold } } },
    { $sort: { absenceCount: -1 } }
  ]);
};

const Attendance = mongoose.model("Attendance", AttendanceRecordSchema);

module.exports = Attendance;
