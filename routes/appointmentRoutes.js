const express = require('express');
const { validate } = require('../middlewares/validate');
const {
  appointmentIdParamSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  
} = require('../utils/validators');
const {
  adminGetAppointments,
  adminCreateAppointment,
  adminUpdateAppointment,
  adminDeleteAppointment,
  getAssignedPatientsForDoctor,
  assignPatientToDoctor
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, authorize('admin','doctor','nurse'), validate(appointmentQuerySchema, 'query'), adminGetAppointments);
router.post('/', protect, authorize('admin'), validate(createAppointmentSchema), adminCreateAppointment); 
router.put('/:id', protect, authorize('admin','doctor'), validate(appointmentIdParamSchema, 'params'), validate(updateAppointmentSchema), adminUpdateAppointment);
router.delete('/:id', protect, authorize('admin'), validate(appointmentIdParamSchema, 'params'), adminDeleteAppointment);

module.exports = router;
