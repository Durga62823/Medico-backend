const Billing = require('../models/billingModel');

// Create a new billing for a patient (admin only)
const createBilling = async (req, res) => {
  try {
    const { patientId, billingItems, totalAmount } = req.body;
    if (!patientId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Patient ID and total amount required' });
    }

    const billing = new Billing({
      patientId,
      billingItems,
      totalAmount,
    });
    await billing.save();

    res.status(201).json({ success: true, message: 'Billing created', data: billing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating billing' });
  }
};

// Get all billings for a patient
const getAllBillings = async (req, res) => {
  try {
    const { patientId } = req.params;
    const billings = await Billing.find({ patientId });
    if (!billings.length) {
      return res.status(404).json({ success: false, message: 'No billings found' });
    }
    res.status(200).json({ success: true, message: 'All billings', data: billings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching billings' });
  }
};

// Get single billing details
const getBillingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const billing = await Billing.findById(id);
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing not found' });
    }
    res.status(200).json({ success: true, message: 'Billing details', data: billing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching billing' });
  }
};
// Get all billings across all patients (admin view)
const getAllBillingsGlobal = async (req, res) => {
  try {
    const billings = await Billing.find();  // Or add filters like req.query.status
    res.status(200).json({ success: true, message: 'All billings', data: billings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching all billings' });
  }
};
// Update billing status (admin only)
const updateBillingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'paid', 'failed'
    const billing = await Billing.findByIdAndUpdate(
      id,
      { paymentStatus: status },
      { new: true }
    );

    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing not found' });
    }

    // Optional: Emit Socket.IO event
    const io = req.app.get('io');
    if (io) io.to('admins').emit('billing:updated', { billingId: id, status });

    res.status(200).json({ success: true, message: 'Billing status updated', data: billing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating billing' });
  }
};

module.exports = {
  createBilling,
  getAllBillings,
  getBillingDetails,
  getAllBillingsGlobal,
  updateBillingStatus
};
