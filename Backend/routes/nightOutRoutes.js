const express = require('express');
const router = express.Router();
const nightOutController = require('../controllers/nightOutController');
const { verifyWardenToken } = require('../middleware/wardenAuth');
const { verifyUserToken, requireStudent } = require('../middleware/auth');

// Student Routes
router.post('/create', verifyUserToken, requireStudent, nightOutController.createPassRequest);
router.get('/my/:studentId', verifyUserToken, requireStudent, nightOutController.getMyPasses);
router.put('/cancel/:passId', verifyUserToken, requireStudent, nightOutController.cancelPass);

// Warden Staff Routes
router.get('/staff/passes', verifyWardenToken, nightOutController.getAllPasses);
router.get('/staff/stats', verifyWardenToken, nightOutController.getDashboardStats);
router.post('/staff/:passId/process', verifyWardenToken, nightOutController.processPass);
router.post('/staff/:passId/checkout', verifyWardenToken, nightOutController.checkOut);
router.post('/staff/:passId/checkin', verifyWardenToken, nightOutController.checkIn);

module.exports = router;
