const LabReport = require('../models/labReportModel');

// List lab reports (filtered by patient, test, or status)
exports.getLabReports = async (req, res) => {
  try {
    const { patient_id, status, test_type } = req.query;
    const query = {};
    if (patient_id) query.patient_id = patient_id;
    if (status) query.status = status;
    if (test_type) query.test_type = test_type;

    const reports = await LabReport.find(query)
      .populate('patient_id', 'full_name')
      .populate('requested_by', 'full_name')
      .populate('appointment_id');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Order a new lab test
exports.orderLabTest = async (req, res) => {
  try {
    const { patient_id, appointment_id, test_type, notes } = req.body;
    const report = await LabReport.create({
      patient_id,
      requested_by: req.user._id,
      appointment_id,
      test_type,
      notes,
      status: 'ordered',
      issued_at: new Date()
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update lab report results/status
exports.updateLabReport = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    Object.assign(report, req.body);
    if (req.body.status === 'completed') {
      report.completed_at = new Date();
    }
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
