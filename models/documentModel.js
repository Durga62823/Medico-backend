const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  original_name: {
    type: String,
    required: true
  },
  mime_type: {
    type: String,
    required: true
  },
  upload_date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
});

module.exports = mongoose.model('Document', documentSchema);
