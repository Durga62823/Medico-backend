const User = require('../models/userModel');
const { Types } = require('mongoose');

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
    const role = String(user.role || '').toLowerCase();
    if (['doctor', 'nurse'].includes(role)) {
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
    const { role, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (role) query.role = String(role).toLowerCase();
    if (search) {
      const regex = new RegExp(String(search), 'i');
      query.$or = [{ full_name: regex }, { email: regex }, { department: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      data: items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: create user
exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name, role, license_number, department, phone } = req.body;
    const normalizedRole = String(role || '').toLowerCase();
    if (!['admin', 'doctor', 'nurse', 'patient'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      email,
      password,
      full_name,
      role: normalizedRole,
      license_number,
      department,
      phone,
    });
    const safe = user.toObject();
    delete safe.password;
    const io = req.app.get('io');
    if (io) io.to('admins').emit('user:created', safe);
    res.status(201).json(safe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getStaffList = async (req, res) => {
    try {
      const { role } = req.query;
      const query = { role: { $in: [/doctor/i, /nurse/i] } };
      
      if (role) {
        // If a specific role is queried, create a case-insensitive regex for it
        query.role = new RegExp(role, 'i');
      }
      
      const staff = await User.find(query, 'id full_name role department');
      if (staff.length === 0) return res.status(404).json({ message: 'No staff found' });
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };





// Admin: get user by id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: update user (non-role fields)
exports.updateUser = async (req, res) => {
  try {
    const { full_name, phone, department, license_number } = req.body;
    const userId = req.params.id;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.full_name = full_name ?? user.full_name;
    user.phone = phone ?? user.phone;
    user.department = department ?? user.department;
    user.license_number = license_number ?? user.license_number;

    const updated = await user.save();
    const safe = updated.toObject();
    delete safe.password;
    const io = req.app.get('io');
    if (io) io.to('admins').emit('user:updated', safe);
    res.json(safe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: update password
exports.updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const userId = req.params.id;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password; // will be hashed by pre-save hook
    await user.save();
    const io = req.app.get('io');
    if (io) io.to('admins').emit('user:passwordUpdated', { _id: user._id });
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: update role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const normalizedRole = String(role || '').toLowerCase();
    if (!['admin', 'doctor', 'nurse', 'patient'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const userId = req.params.id;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = normalizedRole;
    const updated = await user.save();
    const safe = updated.toObject();
    delete safe.password;
    const io = req.app.get('io');
    if (io) io.to('admins').emit('user:roleUpdated', safe);
    res.json(safe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    const io = req.app.get('io');
    if (io) io.to('admins').emit('user:deleted', { _id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};