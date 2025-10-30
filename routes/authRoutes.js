import express from 'express';
import { registerUser, loginUser, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/authController.js';
import { verifyRecaptcha } from '../middleware/recaptchaMiddleware.js';

const router = express.Router();

router.post('/register', verifyRecaptcha, registerUser);
router.post('/login', verifyRecaptcha, loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
