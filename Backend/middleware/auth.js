const jwt = require('jsonwebtoken');

const verifyUserToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel-secret-key');
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireStudent = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required.' });
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  const isAdmin = req.user?.isAdmin === true || role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  return next();
};

module.exports = {
  verifyUserToken,
  requireStudent,
  requireAdmin
};
