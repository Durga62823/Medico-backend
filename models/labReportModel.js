const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patient_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  requested_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // doctor/nurse
  appointment_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  test_type:       { type: String, required: true }, // e.g., 'CBC', 'COVID-19 PCR'
  status:          { type: String, enum: ['ordered', 'in_progress', 'completed', 'cancelled'], default: 'ordered' },
  results_text:    { type: String },
  results_data:    { type: Object }, // key-value pairs for structured numeric results
  files:           [{ type: String }], // paths or URLs to uploaded files (PDF, image)
  notes:           { type: String },
  issued_at:       { type: Date },
  completed_at:    { type: Date }
}, { timestamps: true });

labReportSchema.index({ patient_id: 1, test_type: 1, issued_at: -1 });

module.exports = mongoose.model('LabReport', labReportSchema);
