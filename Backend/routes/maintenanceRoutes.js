const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { verifyUserToken, requireStudent } = require('../middleware/auth');

router.use(verifyUserToken, requireStudent);

// Student Routes
router.post('/create', maintenanceController.createRequest);
router.get('/my/:studentId', maintenanceController.getMyRequests);
router.put('/close/:requestId', maintenanceController.closeRequest);

module.exports = router;
