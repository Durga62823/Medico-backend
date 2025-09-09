// routes/alertRoutes.js (New routes file)
const express = require('express');
const { getAlerts, acknowledgeAlert, dismissAlert } = require('../controllers/alertController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, authorize('Admin', 'Doctor', 'Nurse'), getAlerts);
router.patch('/:id/acknowledge', protect, authorize('Admin', 'Doctor', 'Nurse'), acknowledgeAlert);
router.delete('/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), dismissAlert);

module.exports = router;
