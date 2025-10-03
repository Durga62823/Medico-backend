const PatientAllocation = require('../models/patientallocationModel');
const Patient = require('../models/patientModel');

// Create new patient allocation
exports.createAllocation = async (req, res) => {
  try {
    const { patientId, room, department, status, day, primaryDiagnosis, alerts } = req.body;

    // Fetch patient to get assigned doctor and nurse
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Create allocation
    const allocation = new PatientAllocation({
      patient: patient._id,
      name: patient.full_name,
      room,
      department,
      status,
      day,
      primaryDiagnosis,
      alerts
    });
    console.log(allocation)
    await allocation.save();
    res.status(201).json(allocation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all patient allocations
exports.getAllocations = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let query = {};

    if (role === "Doctor") {
      query = { "patient": { $in: await Patient.find({ assigned_doctor: userId }).distinct("_id") } };
    } else if (role === "Nurse") {
      query = { "patient": { $in: await Patient.find({ assigned_nurse: userId }).distinct("_id") } };
    }

    const allocations = await PatientAllocation.find(query)
      .populate("patient")  // populate patient details
      .sort({ lastUpdated: -1 });

    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get patient allocation by ID
exports.getAllocationById = async (req, res) => {
  try {
    const allocation = await PatientAllocation.findById(req.params.id);
    if (!allocation)
      return res.status(404).json({ error: "Not found" });
    res.json(allocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update patient allocation
exports.updateAllocation = async (req, res) => {
  try {
    const allocation = await PatientAllocation.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!allocation)
      return res.status(404).json({ error: "Not found" });
    res.json(allocation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete patient allocation
exports.deleteAllocation = async (req, res) => {
  try {
    const allocation = await PatientAllocation.findByIdAndDelete(req.params.id);
    if (!allocation)
      return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.dischargeAllocation = async (req, res) => {
  try {
    const allocation = await PatientAllocation.findByIdAndUpdate(
      req.params.id,
      { discharged: true },
      { new: true }
    );
    if (!allocation)
      return res.status(404).json({ error: "Not found" });
    res.json({ message: "Patient discharged", allocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};