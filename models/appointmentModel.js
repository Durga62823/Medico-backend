const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment_type: {
    type: String,
    enum: ['consultation', 'follow-up', 'treatment', 'test', 'other'],
    default: 'consultation'
  },
  appointment_date: { type: String, required: true },  // e.g., "2025-08-13"
  appointment_time: { type: String, required: true },  // e.g., "14:00"
  duration_minutes: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: { type: String }
}, { timestamps: true });

// Indexes for performance (now on strings)
appointmentSchema.index({ patient_id: 1, staff_id: 1, appointment_date: 1, appointment_time: 1 });
appointmentSchema.index({ appointment_date: 1, appointment_time: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
