const express = require('express');
const router = express.Router();
const { verifyUserToken, requireStudent } = require('../middleware/auth');
const messBillingController = require('../controllers/messBillingController');

router.get('/current-bill', verifyUserToken, requireStudent, messBillingController.getCurrentStudentMessBill);
router.post('/submit-utr', verifyUserToken, requireStudent, messBillingController.submitMessBillUtr);

module.exports = router;
