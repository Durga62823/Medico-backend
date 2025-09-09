// vitalSignModel.js (Schema) - Updated with more alert possibilities in comments
const mongoose = require('mongoose');

const vitalSignSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient', 
    required: [true, 'Patient ID is required'],
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by is required'],
  },
  heart_rate: {
    type: Number,  // bpm
    min: 0,
  },
  blood_pressure_systolic: {
    type: Number,
    min: 0,
  },
  blood_pressure_diastolic: {
    type: Number,
    min: 0,
  },
  temperature: {
    type: Number, 
    min: 0,
  },
  oxygen_saturation: {
    type: Number,
    min: 0,
    max: 100,
  },
  respiratory_rate: {
    type: Number,
    min: 0,
  },
  glucose_level: {
    type: Number, 
    min: 0,
  },
  notes: {
    type: String,
  },
  alerts: [{
    type: String,
  }],
}, {
  timestamps: { createdAt: 'recorded_at' },
});

vitalSignSchema.index({ patient_id: 1, recorded_at: -1 });

module.exports = mongoose.model('VitalSign', vitalSignSchema);
