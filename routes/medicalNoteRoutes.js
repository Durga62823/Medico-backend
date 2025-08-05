const express = require('express');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/medicalNoteController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

// Only doctors, nurses, admins can manage notes
router.get('/patients/:id/notes', protect, authorize('Admin', 'Doctor', 'Nurse'), getNotes);
router.post('/patients/:id/notes', protect, authorize('Admin', 'Doctor', 'Nurse'), createNote);
router.put('/notes/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), updateNote);
router.delete('/notes/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), deleteNote);

module.exports = router;
