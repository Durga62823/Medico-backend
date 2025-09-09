// models/alertModel.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  type: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 100,
  },
  acknowledged: {
    type: Boolean,
    default: false,
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
