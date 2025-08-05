const express = require('express');
const { getProfile, updateProfile, getAllUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, authorize('Admin'), getAllUsers);

module.exports = router;