const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // This already creates an index
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'patient'],
    required: [true, 'Role is required'],
  },
  license_number: {
    type: String,  // For doctors/nurses
    required: function () {
      const role = String(this.role || '').toLowerCase();
      return role === 'doctor' || role === 'nurse';
    },
  },
  department: {
    type: String,  // For staff
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid phone number'],
  },
}, {
  timestamps: true,  // Adds created_at and updated_at
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);