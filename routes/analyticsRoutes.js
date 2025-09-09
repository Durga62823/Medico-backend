const express = require('express');
const { getDashboard, getPatientStats, getStaffPerformance, getVitalsTrends, getBillingStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/analytics/dashboard', protect, authorize('Admin', 'Doctor', 'Nurse'), getDashboard);
router.get('/analytics/patients/stats', protect, authorize('Admin', 'Doctor', 'Nurse'), getPatientStats);
router.get('/analytics/staff/performance', protect, authorize('Admin', 'Doctor', 'Nurse'), getStaffPerformance);
router.get('/analytics/vitals/trends', protect, authorize('Admin', 'Doctor', 'Nurse'), getVitalsTrends);
router.get('/analytics/billing/stats', protect, authorize('Admin', 'Doctor', 'Nurse'), getBillingStats);

module.exports = router;
