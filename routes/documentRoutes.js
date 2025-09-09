const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const { uploadDocument, downloadDocument, listDocuments } = require('../controllers/documentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Upload a single file for patient
router.post('/patients/:patientId/documents', protect, authorize('Admin', 'Doctor', 'Nurse'), upload.single('file'), uploadDocument);

// List all documents for patient
router.get('/patients/:patientId/documents', protect, authorize('Admin', 'Doctor', 'Nurse', 'Patient'), listDocuments);

// Download by document ID
router.get('/documents/:id/download', protect, authorize('Admin', 'Doctor', 'Nurse', 'Patient'), downloadDocument);

module.exports = router;
