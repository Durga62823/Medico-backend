const PatientAllocation = require('../models/patientallocationModel');

// Create new patient allocation
exports.createAllocation = async (req, res) => {
  try {
    const allocation = new PatientAllocation(req.body);
    await allocation.save();
    res.status(201).json(allocation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all patient allocations
exports.getAllocations = async (req, res) => {
  try {
    const allocations = await PatientAllocation.find();
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

exports.getAllocations = async (req, res) => {
  try {
    const userRole = req.user.role; // Assuming req.user is populated by auth middleware
    const filter = userRole === "admin" ? {} : { discharged: false };
    const allocations = await PatientAllocation.find(filter);
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error in getAllocations:", err);
  }
};