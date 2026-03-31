const express = require('express');
const router = express.Router();
const messoff = require('../models/Messoff');
const hostelfeedback = require('../models/Feedback');
const messfeedback = require('../models/MessFeedback');
const Complaint = require('../models/Complaint');
const HostelAllotment = require('../models/HostelAllotment');
const AuthModel = require('../models/AuthModel')
const { 
  allocateFirstYears, 
  allocateSeniors, 
  getMasterList, 
  getAllApplications, 
  resetAcademicYear,
  manualAllotStudent,
  cancelStudentAllotment,
  getAvailableRooms
} = require('../controllers/allotmentController');
const { seedRooms, seedApplications, seedStudentUsers } = require('../controllers/seedController');
const { getAllSwapRequests, adminSwapDecision } = require('../controllers/swapController');
const maintenanceController = require('../controllers/maintenanceController');
const nightOutController = require('../controllers/nightOutController');
const duesController = require('../controllers/duesController');
const attendanceController = require('../controllers/attendanceController');
const messBillingController = require('../controllers/messBillingController');
const noticeController = require('../controllers/noticeController');
const { verifyUserToken, requireAdmin } = require('../middleware/auth');

// All /admin routes must be authenticated and admin-only.
router.use(verifyUserToken, requireAdmin);

// Route to fetch mess off data
router.get('/messoff', async (req, res) => {
  try {
    const messoff1 = await messoff.find();
    res.send({ message: 'Data Fetched', messoff: messoff1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/getTotalCount',async (req, res) => {
  try {
    const totalCountStudents = await AuthModel.countDocuments();
    const totalComplaint = await Complaint.countDocuments();
    const HostelAllotted = await HostelAllotment.countDocuments({ alloted: true });
    const HostelNotAllotted = await HostelAllotment.countDocuments({ alloted: false });
    
    res.send({ totalComplaint, totalCountStudents, HostelAllotted, HostelNotAllotted });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})

// Backward-compatible alias for dashboard stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const totalCountStudents = await AuthModel.countDocuments();
    const totalComplaint = await Complaint.countDocuments();
    const HostelAllotted = await HostelAllotment.countDocuments({ alloted: true });
    const HostelNotAllotted = await HostelAllotment.countDocuments({ alloted: false });

    res.send({
      totalComplaint,
      totalCountStudents,
      HostelAllotted,
      HostelNotAllotted
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});
// Route to fetch hostel feedback data
router.get('/hostelfeedback', async (req, res) => {
  try {
    const hostelfeedback1 = await hostelfeedback.find();
    res.send({ message: 'Data Fetched', hostelfeedback: hostelfeedback1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch mess feedback data
router.get('/messfeedback', async (req, res) => {
  try {
    const messfeedback1 = await messfeedback.find();
    res.send({ message: 'Data Fetched', messfeedback: messfeedback1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch complaints data
router.get('/Complaint', async (req, res) => {
  try {
    const Complaint1 = await Complaint.find();
    res.send({ message: 'Data Fetched', Complaint: Complaint1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch hostel allotment data
router.get('/HostelAllotment', async (req, res) => {
  try {
    const HostelAllotment1 = await HostelAllotment.find();
    res.send({ message: 'Data Fetched', HostelAllotment: HostelAllotment1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/master-list', getMasterList); 
router.get('/applications', getAllApplications);

// Route to toggle the allotment status of a hostel
router.post('/toggle-allotment/:id', async (req, res) => {
  try {
    const allotment = await HostelAllotment.findById(req.params.id);
    if (!allotment) {
      return res.status(404).json({ message: 'Allotment not found' });
    }
    allotment.alloted = !allotment.alloted;
    await allotment.save();
    res.json({ message: 'Allotment status updated', alloted: allotment.alloted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/allocate-fy', allocateFirstYears);
router.post('/allocate-seniors', allocateSeniors);
router.post('/seed-rooms', seedRooms);
// convenience endpoint for dev/testing to insert dummy applications
router.post('/seed-applications', seedApplications);
// convenience endpoint for dev/testing to backfill missing student users for applications
router.post('/seed-student-users', seedStudentUsers);
router.post('/reset-year', resetAcademicYear);

// Individual student allotment management
router.post('/manual-allot', manualAllotStudent);
router.post('/cancel-allotment', cancelStudentAllotment);
router.get('/available-rooms', getAvailableRooms);

// Room Swap Management
router.get('/swap-requests', getAllSwapRequests);
router.post('/swap-decision/:requestId', adminSwapDecision);

// Maintenance Request Management
router.get('/maintenance-requests', maintenanceController.getAllRequests);
router.put('/maintenance/:requestId', maintenanceController.updateRequest);
router.get('/maintenance-stats', maintenanceController.getStats);

// Night Out Pass Management
router.get('/nightout-passes', nightOutController.getAllPasses);
router.post('/nightout/:passId/process', nightOutController.processPass);
router.post('/nightout/:passId/checkout', nightOutController.checkOut);
router.post('/nightout/:passId/checkin', nightOutController.checkIn);
router.post('/nightout/mark-overdue', nightOutController.markOverdue);
router.get('/nightout-stats', nightOutController.getDashboardStats);

// Dues & Payment Management
router.get('/dues', duesController.getAllDues);
router.get('/dues-stats', duesController.getDueStats);
router.post('/dues/create', duesController.createDue);
router.post('/dues/bulk-create', duesController.createBulkDues);
router.post('/dues/:dueId/payment', duesController.adminRecordPayment);
router.post('/dues/:dueId/late-fee', duesController.applyLateFee);
router.post('/dues/:dueId/waive', duesController.waiveDue);
router.post('/dues/:dueId/reminder', duesController.sendReminder);
router.post('/dues/mark-overdue', duesController.markOverdue);
router.delete('/dues/:dueId', duesController.deleteDue);

// Smart Attendance System
router.get('/attendance/stats', attendanceController.getAttendanceStats);
router.get('/attendance/report/:date', attendanceController.getExceptionReport);
router.get('/attendance/report', attendanceController.getExceptionReport);
router.get('/attendance/chronic-absentees', attendanceController.getChronicAbsentees);
router.post('/attendance/dispatch-alerts', attendanceController.dispatchAlerts);
router.delete('/attendance/:id', attendanceController.deleteAttendanceRecord);

// Home Notice Board Management
router.get('/notices/config', noticeController.getNoticeConfig);
router.put('/notices/config', noticeController.updateNoticeConfig);
router.get('/notices', noticeController.getAdminNotices);
router.post('/notices', noticeController.createNotice);
router.put('/notices/:noticeId', noticeController.updateNotice);
router.delete('/notices/:noticeId', noticeController.deleteNotice);

// Mess Billing System
router.post('/mess-bills/preview', (req, res) => {
  req.query.preview = 'true';
  return messBillingController.generateMonthlyMessBills(req, res);
});
router.post('/mess-bills/generate', messBillingController.generateMonthlyMessBills);
router.get('/messoff/pending', messBillingController.getPendingMessOffRequests);
router.patch('/messoff/:requestId/approve', messBillingController.approveMessOffRequest);
router.patch('/messoff/:requestId/reject', messBillingController.rejectMessOffRequest);
router.get('/mess-bills/verification', messBillingController.getVerificationMessBills);
router.patch('/mess-bills/:billId/approve', messBillingController.approveMessBillVerification);
router.patch('/mess-bills/:billId/reject', messBillingController.rejectMessBillVerification);

module.exports = router;
