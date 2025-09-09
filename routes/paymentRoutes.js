const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { createOrder, capturePayment, getAllBillings, getBillingDetails } = require('../controllers/paymentController');

const router = express.Router();

// Create PayPal order (admin for billing)
router.post('/create-order', protect, authorize('Admin'), createOrder);

// Capture/verify payment
router.post('/capture', protect, authorize('Admin'), capturePayment);  // Or make public for callbacks

// Get billings (admin/patient view)
router.get('/patient/:patientId', protect, authorize('Admin', 'Patient'), getAllBillings);
router.get('/:id', protect, authorize('Admin', 'Patient'), getBillingDetails);

module.exports = router;
