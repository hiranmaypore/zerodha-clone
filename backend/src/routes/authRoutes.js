const express = require('express');
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { signupSchema, loginSchema } = require('../middleware/validator');

const router = express.Router();

router.post('/signup', signupSchema, registerUser);
router.post('/login', loginSchema, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
