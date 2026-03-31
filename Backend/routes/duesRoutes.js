const express = require('express');
const router = express.Router();
const duesController = require('../controllers/duesController');
const { verifyUserToken, requireStudent } = require('../middleware/auth');

router.use(verifyUserToken, requireStudent);

// Student Routes
router.get('/my/:studentId', duesController.getMyDues);
router.get('/history/:dueId', duesController.getPaymentHistory);
router.post('/pay/:dueId', duesController.recordPayment);

module.exports = router;
