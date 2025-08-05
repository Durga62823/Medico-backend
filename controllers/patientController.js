const Patient = require('../models/patientModel');
const User = require('../models/userModel');

// Get all patients (role-filtered: doctors/nurses see assigned, admins see all)
exports.getAllPatients = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Doctor') {
      query.assigned_doctor = req.user._id;
    } else if (req.user.role === 'Nurse') {
      query.assigned_nurse = req.user._id;
    } // Admins get all; Patients can't access this

    const patients = await Patient.find(query);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single patient by ID
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Access check: Only assigned staff or admin
    if (req.user.role !== 'Admin' &&
        patient.assigned_doctor.toString() !== req.user._id.toString() &&
        patient.assigned_nurse.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this patient' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create patient (admin only)
exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update patient (with assignment logic)
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Access check: Only assigned staff or admin
    if (req.user.role !== 'Admin' &&
        patient.assigned_doctor.toString() !== req.user._id.toString() &&
        patient.assigned_nurse.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this patient' });
    }

    // Assignment logic: Validate and assign doctor/nurse
    if (req.body.assigned_doctor) {
      const doctor = await User.findById(req.body.assigned_doctor);
      if (!doctor || doctor.role !== 'Doctor') {
        return res.status(400).json({ message: 'Invalid doctor assignment' });
      }
    }
    if (req.body.assigned_nurse) {
      const nurse = await User.findById(req.body.assigned_nurse);
      if (!nurse || nurse.role !== 'Nurse') {
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
