const mongoose = require('mongoose');

const medicalNoteSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note_type: {
    type: String,
    enum: ['diagnosis', 'treatment', 'observation', 'prescription'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance with search/filter
medicalNoteSchema.index({ patient_id: 1, note_type: 1, created_at: -1 });
medicalNoteSchema.index({ content: 'text' }); // For search

module.exports = mongoose.model('MedicalNote', medicalNoteSchema);
