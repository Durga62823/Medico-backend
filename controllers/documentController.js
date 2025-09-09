const Document = require('../models/documentModel');
const fs = require('fs');
const path = require('path');

// Upload file(s) and link to patient
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) throw new Error('No file provided');

    const document = await Document.create({
      patient_id: req.params.patientId,
      uploaded_by: req.user._id,
      file_path: req.file.path,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      description: req.body.description || ''
    });

    res.status(201).json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Download a document by ID
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // Security: Add permission checks here (e.g., only assigned staff, patient, or admin)
    const filePath = path.resolve(document.file_path);
    res.download(filePath, document.original_name);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List documents for a patient
exports.listDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ patient_id: req.params.patientId });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
