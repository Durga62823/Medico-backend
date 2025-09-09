const express = require('express');
const {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStats,
  assignStaffToPatient,
  getAssignedPatients,
  assignPatientToDoctor
} = require('../controllers/patientController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { patientIdParamSchema, assignStaffSchema, patientStatsQuerySchema } = require('../utils/validators');

const router = express.Router();

// ✅ Static routes first
router.get('/stats', protect, authorize('Admin'), validate(patientStatsQuerySchema, 'query'), getPatientStats);

// ✅ Main routes
router.get('/', protect, authorize('Admin', 'Doctor', 'Nurse'), getAllPatients);
router.post('/', protect, authorize('Admin'), createPatient);

// ✅ Dynamic routes last
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), getPatient);
router.put('/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), updatePatient);
router.delete('/:id', protect, authorize('Admin'), deletePatient);
// router.get('/assigned-patients', protect, getAssignedPatients); 
// router.put('/assign', protect, authorize('admin'), assignPatientToDoctor);
// ✅ Assign staff (dynamic but specific)
router.put('/:id/assign', protect, authorize('Admin'), validate(patientIdParamSchema, 'params'), validate(assignStaffSchema), assignStaffToPatient);

module.exports = router;