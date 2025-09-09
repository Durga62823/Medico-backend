// models/patient.js (Schema) - Ensure assigned_doctor and assigned_nurse fields exist
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
  },
  date_of_birth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  blood_type: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid phone number'],
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  address: {
    type: String,
  },
  emergency_contact_name: {
    type: String,
  },
  emergency_contact_phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid phone number'],
  },
  medical_history: [{
    type: String,  // Changed to array for multiple history entries (better for EHR)
  }],
  allergies: [{
    type: String,
  }],
  current_medications: [{
    type: String,
  }],
  admission_date: {
    type: Date,
  },
  discharge_date: {
    type: Date,
  },
  assigned_doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to User model (Doctor)
  },
  assigned_nurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to User model (Nurse)
  },
  status: {
    type: String,
    enum: ['Active', 'Discharged', 'Transferred'],
    default: 'Active',
  },
  // NEW: References for vitals and medical records (for tracking and access)
  vitals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VitalSign',  // Link to VitalSign model for history
  }],
  medical_records: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalNote',  // Link to MedicalNote model for EHR access
  }],
}, {
  timestamps: true,
});

// Indexing for common queries
patientSchema.index({ full_name: 'text' });  // Text search for names
patientSchema.index({ assigned_doctor: 1, status: 1 });
patientSchema.index({ assigned_nurse: 1, status: 1 });

module.exports = mongoose.model('Patient', patientSchema);