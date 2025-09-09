const Joi = require('joi');

const userIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
const getStaffQuerySchema = Joi.object({
  role: Joi.string().lowercase().valid('doctor', 'nurse').optional(),
});


const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(120).required(),
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'patient').required(),
  license_number: Joi.when('role', {
    is: Joi.valid('doctor', 'nurse'),
    then: Joi.string().pattern(/^[A-Z0-9]{6,12}$/).required(),
    otherwise: Joi.string().optional().allow('', null),
  }),
  department: Joi.string().max(120).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(120).optional(),
  department: Joi.string().max(120).optional().allow(null),
  license_number: Joi.string().pattern(/^[A-Z0-9]{6,12}$/).optional().allow(null),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null),
}).min(1);

const updateUserPasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'patient').required(),
});

const getAllUsersQuerySchema = Joi.object({
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'patient').optional(),
  search: Joi.string().max(120).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),
});

// Patient assignment (admin assigns doctor/nurse to patient)
const patientIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const assignStaffSchema = Joi.object({
  assigned_doctor: Joi.string().hex().length(24).optional().allow(null, ''),
  assigned_nurse: Joi.string().hex().length(24).optional().allow(null, ''),
}).or('assigned_doctor', 'assigned_nurse'); // At least one required

// Patient stats query (optional: by date range, etc.)
const patientStatsQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

// Appointment validation
const appointmentIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({ 'string.hex': 'Invalid ID format' }),
});


const createAppointmentSchema = Joi.object({
  patient_id: Joi.string().hex().length(24).required().messages({ 'string.hex': 'Invalid patient ID' }),
  staff_id: Joi.string().hex().length(24).required().messages({ 'string.hex': 'Invalid staff ID' }),
  appointment_date: Joi.string().required().messages({ 'any.required': 'Appointment date is required' }),
  appointment_time: Joi.string().required().messages({ 'any.required': 'Appointment time is required' }),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'no-show').lowercase().default('scheduled'),
  notes: Joi.string().max(1000).optional().allow(''),
  appointment_type: Joi.string().valid('consultation', 'follow-up', 'treatment', 'test', 'other').default('consultation'),
});
const updateAppointmentSchema = Joi.object({
  patient_id: Joi.string().hex().length(24).optional().messages({ 'string.hex': 'Invalid patient ID' }),
  staff_id: Joi.string().hex().length(24).optional().messages({ 'string.hex': 'Invalid staff ID' }),
  appointment_date: Joi.string().optional(),
  appointment_time: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'no-show').lowercase().optional(),
  notes: Joi.string().max(1000).optional().allow(''),
  appointment_type: Joi.string().valid('consultation', 'follow-up', 'treatment', 'test', 'other').optional(),
}).min(1);



const appointmentQuerySchema = Joi.object({
  patient_id: Joi.string().hex().length(24).optional(),
  staff_id: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'no-show').lowercase().optional(),
  from: Joi.string().optional(),  // Now string for date range
  to: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),  // Changed to createdAt since no scheduled_at Date
});
module.exports = {
  userIdParamSchema,
  createUserSchema,
  updateUserSchema,
  updateUserPasswordSchema,
  updateUserRoleSchema,
  getAllUsersQuerySchema,
  patientIdParamSchema,
  assignStaffSchema,
  patientStatsQuerySchema,
  appointmentIdParamSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
};

