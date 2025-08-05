const express = require('express');
const { getVitals, recordVitals, getTrends } = require('../controllers/vitalSignController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });  // For nested routes

// Nested under patients
router.get('/patients/:id/vitals', protect, authorize('Admin', 'Doctor', 'Nurse'), getVitals);
router.post('/patients/:id/vitals', protect, authorize('Admin', 'Doctor', 'Nurse'), recordVitals);
router.get('/patients/:id/vitals/trends', protect, authorize('Admin', 'Doctor', 'Nurse'), getTrends);

module.exports = router;
