const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const { verifyUserToken, requireStudent } = require('../middleware/auth');

router.use(verifyUserToken, requireStudent);

/**
 * Room Swap Routes
 * Student-facing endpoints for room swap requests
 */

// Create a new swap request
router.post('/request', swapController.createSwapRequest);

// Get all swap requests for a student
router.get('/my-requests/:studentId', swapController.getMySwapRequests);

// Respond to a swap request (accept/decline)
router.post('/respond/:requestId', swapController.respondToSwapRequest);

// Cancel a swap request
router.post('/cancel/:requestId', swapController.cancelSwapRequest);

// Get eligible swap targets
router.get('/eligible-targets/:studentId', swapController.getEligibleSwapTargets);

module.exports = router;
