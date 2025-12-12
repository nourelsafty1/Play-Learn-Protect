// src/routes/auth.js

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  updateNotifications,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validate 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);

// Protected routes (must be logged in)
router.use(protect); // All routes below require authentication

router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.put('/notifications', updateNotifications);
router.post('/logout', logout);

module.exports = router;