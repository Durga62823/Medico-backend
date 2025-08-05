const express = require('express');
const { register, login, logout, refresh } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', protect, refresh);

module.exports = router;
