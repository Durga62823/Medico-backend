// patientController.js - Updated to properly filter assigned patients with role-based access
const mongoose = require('mongoose');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');

// Get all patients (role-filtered: doctors/nurses see assigned, admins see all, with optional query filters)
exports.getAllPatients = async (req, res) => {
  try {
    let query = { ...req.query }; // Start with any passed filters (e.g., status, name search)

    // Role-based base filter
    if (req.user.role === 'Doctor') {
      query.assigned_doctor = req.user._id;
    } else if (req.user.role === 'Nurse') {
      query.assigned_nurse = req.user._id;
    } // Admins can see all, with optional filters

    const patients = await Patient.find(query);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single patient (with access check)
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assigned_doctor', 'full_name email')
      .populate('assigned_nurse', 'full_name email')
      .populate('vitals')
      .populate('medical_records');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const isAdmin = req.user.role === 'Admin';
    const isAssignedDoctor = patient.assigned_doctor?._id?.toString() === req.user._id.toString();
    const isAssignedNurse = patient.assigned_nurse?._id?.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedDoctor && !isAssignedNurse) {
      return res.status(403).json({ message: 'Not authorized to access this patient' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create patient
exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Access check: Only assigned staff or admin
    if (req.user.role.toLowerCase() !== 'admin' && 
        patient.assigned_doctor?.toString() !== req.user._id.toString() &&
        patient.assigned_nurse?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this patient' });
    }

    // Assignment validation
    if (req.body.assigned_doctor) {
      const doctor = await User.findById(req.body.assigned_doctor);
      if (!doctor || doctor.role.toLowerCase() !== 'doctor') {
          return res.status(400).json({ message: 'Invalid doctor assignment' });
      }
    }
    if (req.body.assigned_nurse) {
      const nurse = await User.findById(req.body.assigned_nurse);
      if (!nurse || nurse.role.toLowerCase() !== 'nurse') {
          return res.status(400).json({ message: 'Invalid nurse assignment' });
      }
    }

    Object.assign(patient, req.body);
    await patient.save();
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete patient (admin only)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient stats (admin only)
exports.getPatientStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    // Aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          byGender: [
            { $group: { _id: '$gender', count: { $sum: 1 } } },
          ],
          admissions: [
            { $match: { admission_date: { $ne: null } } },
            { $count: 'count' },
          ],
          discharges: [
            { $match: { discharge_date: { $ne: null } } },
            { $count: 'count' },
          ],
        },
      },
    ];
    const result = await Patient.aggregate(pipeline);
    const stats = result[0] || {};
    res.json({
      total: stats.total?.[0]?.count || 0,
      byStatus: stats.byStatus || [],
      byGender: stats.byGender || [],
      admissions: stats.admissions?.[0]?.count || 0,
      discharges: stats.discharges?.[0]?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign staff to patient
exports.assignStaffToPatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid patient id' });
    }
    const { assigned_doctor, assigned_nurse } = req.body;
    const update = {};
    // Validate doctor
    if (assigned_doctor) {
      if (!mongoose.Types.ObjectId.isValid(assigned_doctor)) {
        return res.status(400).json({ message: 'Invalid doctor id' });
      }
      const doctor = await User.findById(assigned_doctor);
      if (!doctor || doctor.role.toLowerCase() !== 'doctor') {
        return res.status(400).json({ message: 'Assigned doctor not found or not a doctor' });
      }
      update.assigned_doctor = assigned_doctor;
    }
    // Validate nurse
    if (assigned_nurse) {
      if (!mongoose.Types.ObjectId.isValid(assigned_nurse)) {
        return res.status(400).json({ message: 'Invalid nurse id' });
      }
      const nurse = await User.findById(assigned_nurse);
      if (!nurse || nurse.role.toLowerCase() !== 'nurse') {
        return res.status(400).json({ message: 'Assigned nurse not found or not a nurse' });
      }
      update.assigned_nurse = assigned_nurse;
    }
    if (!assigned_doctor && !assigned_nurse) {
      return res.status(400).json({ message: 'Must assign at least a doctor or a nurse' });
    }
    const patient = await Patient.findByIdAndUpdate(id, update, { new: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    // Emit Socket.IO event to admins
    const io = req.app.get('io');
    if (io) io.to('admins').emit('patient:assigned', { patientId: id, assigned_doctor, assigned_nurse });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
