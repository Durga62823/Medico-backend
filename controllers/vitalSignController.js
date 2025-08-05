const mongoose = require('mongoose');
const VitalSign = require('../models/vitalSignModel');
const Patient = require('../models/patientModel');

// Get vitals for a patient (historical)
exports.getVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const assignedDoctorId = patient.assigned_doctor ? patient.assigned_doctor.toString() : null;
    const assignedNurseId = patient.assigned_nurse ? patient.assigned_nurse.toString() : null;

    if (req.user.role !== 'Admin' &&
        assignedDoctorId !== req.user._id.toString() &&
        assignedNurseId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const vitals = await VitalSign.find({ patient_id: req.params.id }).sort({ recorded_at: -1 });
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record new vital signs
exports.recordVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const assignedDoctorId = patient.assigned_doctor ? patient.assigned_doctor.toString() : null;
    const assignedNurseId = patient.assigned_nurse ? patient.assigned_nurse.toString() : null;

    if (req.user.role === 'Patient' || 
        (req.user.role !== 'Admin' &&
         assignedDoctorId !== req.user._id.toString() &&
         assignedNurseId !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to record vitals' });
    }

    req.body.patient_id = req.params.id;
    req.body.recorded_by = req.user._id;

    const alerts = [];
    if (req.body.heart_rate > 100 || req.body.heart_rate < 60) alerts.push('Abnormal heart rate');
    if (req.body.blood_pressure_systolic > 140 || req.body.blood_pressure_diastolic > 90) alerts.push('High blood pressure');

    const vital = await VitalSign.create(req.body);

    res.status(201).json({ vital, alerts });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get trends for a patient (e.g., daily average heart rate)
exports.getTrends = async (req, res) => {
  try {
    const patientId = req.params.id;

    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const trends = await VitalSign.aggregate([
      { $match: { patient_id: new mongoose.Types.ObjectId(patientId) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recorded_at' } },
          avgHeartRate: { $avg: '$heart_rate' },
          avgTemperature: { $avg: '$temperature' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
