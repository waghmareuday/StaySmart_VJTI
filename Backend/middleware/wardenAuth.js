const jwt = require('jsonwebtoken');
const { getManagedBlocks } = require('../utils/wardenAccess');

const verifyWardenToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel-secret-key');
    const role = String(decoded.role || '').toUpperCase();
    const isWardenToken = decoded.isWarden === true || role === 'WARDEN' || role === 'CHIEF_WARDEN';

    if (!isWardenToken) {
      return res.status(403).json({ success: false, message: 'Warden access required.' });
    }

    req.warden = decoded;
    req.managedBlocks = getManagedBlocks(decoded);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = {
  verifyWardenToken
};
