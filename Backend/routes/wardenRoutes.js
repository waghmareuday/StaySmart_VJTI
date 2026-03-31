const express = require('express');
const router = express.Router();
const wardenController = require('../controllers/wardenController');
const { verifyWardenToken } = require('../middleware/wardenAuth');

// Middleware to check if warden is Chief Warden
const requireChiefWarden = (req, res, next) => {
  const role = String(req.warden?.role || '').toUpperCase();
  if (role !== 'CHIEF_WARDEN') {
    return res.status(403).json({ success: false, message: 'Access denied. Chief warden privileges required.' });
  }
  next();
};

// Public routes
router.post('/login', wardenController.loginWarden);

// Warden routes (requires authentication)
router.get('/profile/:id', verifyWardenToken, wardenController.getWardenProfile);

// Admin/Chief Warden routes (requires authentication + chief warden role)
router.post('/register', verifyWardenToken, requireChiefWarden, wardenController.registerWarden);
router.get('/all', verifyWardenToken, requireChiefWarden, wardenController.getAllWardens);
router.put('/:id', verifyWardenToken, requireChiefWarden, wardenController.updateWarden);
router.delete('/:id', verifyWardenToken, requireChiefWarden, wardenController.deleteWarden);

// Seed route is restricted to chief warden to avoid destructive unauthenticated resets.
router.post('/seed', verifyWardenToken, requireChiefWarden, wardenController.seedWardens);

module.exports = router;
