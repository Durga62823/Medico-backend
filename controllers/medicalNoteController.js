const MedicalNote = require('../models/medicalNoteModel');

// Get all notes for a patient (with query filters)
exports.getNotes = async (req, res) => {
  try {
    const { note_type, date, search } = req.query;
    const query = { patient_id: req.params.id };
    if (note_type) query.note_type = note_type;
    if (date) {
      // Filter by date string, e.g., '2025-08-01'
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.created_at = { $gte: start, $lt: end };
    }
    if (search) query.$text = { $search: search };

    const notes = await MedicalNote.find(query).populate('author', 'full_name role');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new note for a patient
exports.createNote = async (req, res) => {
  try {
    const note = await MedicalNote.create({
      ...req.body,
      patient_id: req.params.id,
      author: req.user._id,
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update note
exports.updateNote = async (req, res) => {
  try {
    const note = await MedicalNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    note.content = req.body.content || note.content;
    note.note_type = req.body.note_type || note.note_type;
    note.updated_at = new Date();
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const note = await MedicalNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await note.remove();
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
