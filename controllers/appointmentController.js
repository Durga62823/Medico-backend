
const { Types } = require('mongoose');
const Appointment = require('../models/appointmentModel');

// Get appointments with filters, pagination, sorting
exports.adminGetAppointments = async (req, res) => {
  try {
    let { patient_id, staff_id, status, from, to, page, limit, sort } = req.query;
    
    const query = {};

    // Filter by patient_id if valid
    if (patient_id && Types.ObjectId.isValid(patient_id)) {
      query.patient_id = patient_id;
    }

    // Filter by staff_id if valid
    if (staff_id && Types.ObjectId.isValid(staff_id)) {
      query.staff_id = staff_id;
    }

    // Filter by appointment status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (from || to) {
      query.appointment_date = {};
      if (from) query.appointment_date.$gte = new Date(from);
      if (to) query.appointment_date.$lte = new Date(to);
    }

    // Pagination and sorting
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Run both queries in parallel
    const [items, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient_id', 'full_name')
        .populate('staff_id', 'full_name role')
        .sort(sort || "-appointment_date")
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(query),
    ]);

    // Send response with data and metadata
    res.json({
      data: items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new appointment
exports.adminCreateAppointment = async (req, res) => {
  try {
    const { patient_id, staff_id, appointment_date, appointment_time, status, notes, appointment_type } = req.body;

    // Validate patient and staff IDs
    if (!Types.ObjectId.isValid(patient_id) || !Types.ObjectId.isValid(staff_id)) {
      return res.status(400).json({ message: 'Invalid patient or staff id' });
    }

    // Check if the time slot is already booked for the same staff
    const overlap = await Appointment.findOne({
      staff_id,
      appointment_date,
      appointment_time,
      status: 'scheduled',
    });

    if (overlap) {
      return res.status(409).json({ message: 'Time slot unavailable for selected staff' });
    }

    // Create the appointment
    const appointment = await Appointment.create({
      patient_id,
      staff_id,
      appointment_date,
      appointment_time,
      appointment_type: appointment_type || 'consultation',
      duration_minutes: req.body.duration_minutes || 30,
      status: status || 'scheduled',
      notes,
    });

    // Emit a socket event if available
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('appointment:updated', { action: 'created', appointment });
    }

    // Return the newly created appointment
    res.status(201).json(appointment);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing appointment
exports.adminUpdateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, patient_id, staff_id, status, notes, appointment_type, duration_minutes } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      console.log("Invalid ID format:", id);
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update fields if provided
    if (appointment_date) appointment.appointment_date = appointment_date;
    if (appointment_time) appointment.appointment_time = appointment_time;
    if (patient_id && Types.ObjectId.isValid(patient_id)) appointment.patient_id = patient_id;
    if (staff_id && Types.ObjectId.isValid(staff_id)) appointment.staff_id = staff_id;
    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;
    if (appointment_type) appointment.appointment_type = appointment_type;
    if (duration_minutes) appointment.duration_minutes = duration_minutes;

    await appointment.save();

    // Emit a socket event if available
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('appointment:updated', { action: 'updated', appointment });
    }

    res.json(appointment);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an appointment
exports.adminDeleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Emit a socket event if available
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('appointment:updated', { action: 'deleted', appointmentId: id });
    }

    res.json({ message: 'Appointment deleted' });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};