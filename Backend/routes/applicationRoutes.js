const express = require('express');
const router = express.Router();
const { 
  submitApplication, 
  acceptRoommateRequest, 
  getStudentDashboard, 
  cancelRoommateRequest,
  declineRoommateRequest,
  withdrawApplication
} = require('../controllers/applicationController');
const { verifyUserToken, requireStudent } = require('../middleware/auth');

router.use(verifyUserToken, requireStudent);

// POST /api/applications/submit
router.post('/submit', submitApplication);
router.post('/accept-roommate', acceptRoommateRequest);
router.post('/decline-roommate', declineRoommateRequest);
router.post('/cancel-roommate', cancelRoommateRequest);
router.post('/withdraw', withdrawApplication);
router.get('/dashboard/:studentId', getStudentDashboard);


module.exports = router;