const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });  
};

// Register user with professional email validation
exports.register = async (req, res) => {
  const { email, password, full_name, role, license_number, department, phone } = req.body;

  // Professional email validation for staff
  const normalizedRole = String(role || '').toLowerCase();
  const isProfessionalEmail = /\.(com|org|edu)$/i.test(email);  // Basic check; enhance as needed
  if (['doctor', 'nurse'].includes(normalizedRole) && !isProfessionalEmail) {
    return res.status(400).json({ message: 'Professional email required for healthcare staff' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ email, password, full_name, role: normalizedRole, license_number, department, phone });
    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// Refresh token (re-issue based on existing valid token)
exports.refresh = async (req, res) => {
  // Assumes protect middleware is used; re-generates token
  res.json({ token: generateToken(req.user._id) });
};

// Logout (client-side token discard; server can't invalidate stateless JWT)
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful (discard token client-side)' });
};
