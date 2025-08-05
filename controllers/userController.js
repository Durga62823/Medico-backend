const User = require('../models/userModel');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { full_name, phone, department, license_number } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Professional credential validation on update (for staff)
    if (['Doctor', 'Nurse'].includes(user.role)) {
      if (license_number && license_number !== user.license_number) {
        // Add custom validation logic here, e.g., check against a registry API if needed
        if (!/^[A-Z0-9]{6,12}$/.test(license_number)) {  // Example regex for license format
          return res.status(400).json({ message: 'Invalid license number format' });
        }
      }
      if (department) user.department = department;
    }

    user.full_name = full_name || user.full_name;
    user.phone = phone || user.phone;
    user.license_number = license_number || user.license_number;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
