import express from 'express';
import {
  register,
  login,
  googleLogin,
  getMe,
  updateMe,
  resendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
