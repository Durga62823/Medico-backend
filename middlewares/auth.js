const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};


const authorize = (...roles) => {
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    const userRole = String(req.user.role || '').toLowerCase();
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized for this action` });
    }
    next();
  };
};

module.exports = { protect, authorize };