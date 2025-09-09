const express = require('express');
const {
  getLabReports,
  orderLabTest,
  updateLabReport
} = require('../controllers/labReportController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/labreports', protect, authorize('Admin', 'Doctor', 'Nurse', 'Patient'), getLabReports);
router.post('/labreports', protect, authorize('Admin', 'Doctor', 'Nurse'), orderLabTest);
router.put('/labreports/:id', protect, authorize('Admin', 'Doctor', 'Nurse'), updateLabReport);

module.exports = router;
