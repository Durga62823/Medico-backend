const express = require('express');
const { getAllPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, authorize('Admin', 'Doctor', 'Nurse'), getAllPatients);
router.post('/', protect, authorize('Admin'), createPatient);
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), getPatient);
router.put('/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), updatePatient);
router.delete('/:id', protect, authorize('Admin'), deletePatient);

module.exports = router;
