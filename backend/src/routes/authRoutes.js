const express = require('express');
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, signupSchema, authSchema } = require('../middleware/validator');

const router = express.Router();

router.post('/signup', validate(signupSchema), registerUser);
router.post('/login', validate(authSchema), loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
