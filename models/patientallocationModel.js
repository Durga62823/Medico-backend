const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: String, // e.g., "Hypotension", "Tachycardia", etc.
  message: String // e.g., "Elevated Temperature"
}, { _id: false });

const VitalsSchema = new mongoose.Schema({
  bp: String,   // blood pressure, e.g., "128/82"
  hr: Number,   // heart rate
  temp: String, // temperature, e.g., "98.6°F"
  rr: Number,   // respiration rate
  spo2: String  // e.g., "97%"
}, { _id: false });

const PatientAllocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ["stable", "critical", "monitoring", "improving"], required: true },
  day: { type: Number, required: true },
  primaryDiagnosis: { type: String, required: true },
  vitals: VitalsSchema,
  alerts: [AlertSchema],
  lastUpdated: { type: Date, default: Date.now },
   discharged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PatientAllocation', PatientAllocationSchema);
