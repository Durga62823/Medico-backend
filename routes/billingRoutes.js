const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { createBilling, getAllBillings, getBillingDetails,getAllBillingsGlobal, updateBillingStatus } = require('../controllers/billingController');

const router = express.Router();

// Create a new billing (admin only)
router.post('/', protect, authorize('Admin'), createBilling);
// Get all billings (admin only)
router.get('/', protect, authorize('Admin'), getAllBillingsGlobal);

// Get all billings for a patient (admin or patient view)
router.get('/patient/:patientId', protect, authorize('Admin', 'Patient'), getAllBillings);

// Get single billing details
router.get('/:id', protect, authorize('Admin', 'Patient'), getBillingDetails);

// Update billing status (e.g., after payment; admin only)
router.patch('/:id/status', protect, authorize('Admin'), updateBillingStatus);

module.exports = router;
