const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyWardenToken } = require('../middleware/wardenAuth');

// ========== WARDEN ROUTES ==========

// Get list of blocks (for selector)
router.get('/blocks', verifyWardenToken, attendanceController.getBlocks);

// Get rooms with students for attendance (pre-marks approved leaves)
router.get('/rooms/:block', verifyWardenToken, attendanceController.getRoomsForAttendance);

// Submit attendance - only saves absent students
router.post('/submit', verifyWardenToken, attendanceController.submitAttendance);

// Get student's attendance history
router.get('/student/:studentId', verifyWardenToken, attendanceController.getStudentAttendance);

module.exports = router;
