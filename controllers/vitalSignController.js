// vitalSignController.js (Controllers) - Expanded with all scenarios
const VitalSign = require('../models/vitalSignModel');
const Patient = require('../models/patientModel');
const Alert = require('../models/alertModel');

exports.recordVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    req.body.patient_id = req.params.id;
    req.body.recorded_by = req.user._id;

    const alerts = [];
    
    // Heart Rate Alerts
    if (req.body.heart_rate > 100) alerts.push({ type: 'critical', title: 'High Heart Rate', message: 'Heart rate exceeds maximum threshold (100 bpm).' });
    if (req.body.heart_rate < 60) alerts.push({ type: 'warning', title: 'Low Heart Rate', message: 'Heart rate below minimum threshold (60 bpm).' });
    
    // Blood Pressure Alerts
    if (req.body.blood_pressure_systolic > 140) alerts.push({ type: 'warning', title: 'High Systolic BP', message: 'Systolic blood pressure exceeds maximum (140 mmHg).' });
    if (req.body.blood_pressure_systolic < 90) alerts.push({ type: 'critical', title: 'Low Systolic BP', message: 'Systolic blood pressure below minimum (90 mmHg).' });
    if (req.body.blood_pressure_diastolic > 90) alerts.push({ type: 'warning', title: 'High Diastolic BP', message: 'Diastolic blood pressure exceeds maximum (90 mmHg).' });
    if (req.body.blood_pressure_diastolic < 60) alerts.push({ type: 'critical', title: 'Low Diastolic BP', message: 'Diastolic blood pressure below minimum (60 mmHg).' });
    
    // Temperature Alerts
    if (req.body.temperature > 100.4) alerts.push({ type: 'warning', title: 'High Temperature', message: 'Temperature exceeds maximum (100.4°F).' });
    if (req.body.temperature < 95) alerts.push({ type: 'critical', title: 'Low Temperature', message: 'Temperature below minimum (95°F).' });
    
    // Oxygen Saturation Alerts
    if (req.body.oxygen_saturation < 90) alerts.push({ type: 'critical', title: 'Low Oxygen Saturation', message: 'Oxygen saturation below minimum (90%).' });
    
    // Respiratory Rate Alerts
    if (req.body.respiratory_rate > 20) alerts.push({ type: 'warning', title: 'High Respiratory Rate', message: 'Respiratory rate exceeds maximum (20 breaths/min).' });
    if (req.body.respiratory_rate < 12) alerts.push({ type: 'critical', title: 'Low Respiratory Rate', message: 'Respiratory rate below minimum (12 breaths/min).' });
    
    // Glucose Level Alerts
    if (req.body.glucose_level > 180) alerts.push({ type: 'warning', title: 'High Glucose Level', message: 'Glucose level exceeds maximum (180 mg/dL).' });
    if (req.body.glucose_level < 70) alerts.push({ type: 'critical', title: 'Low Glucose Level', message: 'Glucose level below minimum (70 mg/dL).' });

    const vital = await VitalSign.create(req.body);

    // Save alerts to database
    for (const alertData of alerts) {
      await Alert.create({
        patient_id: req.params.id,
        ...alertData,
        timestamp: new Date(),
      });
    }

    const io = req.app.get('io');
    if (alerts.length > 0) {
      const alertMessage = {
        patient_id: req.params.id,
        alerts,
        timestamp: new Date(),
      };
      if (patient.assigned_doctor) {
        io.to(`doctor_${patient.assigned_doctor}`).emit('vital_alert', alertMessage);
      }
      if (patient.assigned_nurse) {
        io.to(`nurse_${patient.assigned_nurse}`).emit('vital_alert', alertMessage);
      }
    }

    res.status(201).json({ vital, alerts });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Get vitals for a patient
exports.getVitals = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const assignedDoctorId = patient.assigned_doctor ? patient.assigned_doctor.toString() : null;
    const assignedNurseId = patient.assigned_nurse ? patient.assigned_nurse.toString() : null;

    if (req.user.role.toLowerCase() !== 'admin' && 
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

// Record new vital signs with expanded alert generation


// Get trends for a patient
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
          avgOxygenSaturation: { $avg: '$oxygen_saturation' },
          avgRespiratoryRate: { $avg: '$respiratory_rate' },
          alertCount: { $sum: { $size: '$alerts' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
