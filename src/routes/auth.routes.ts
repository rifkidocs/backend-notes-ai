import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Google OAuth
router.get('/google', authLimiter, authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// GitHub OAuth
router.get('/github', authLimiter, authController.githubAuth);
router.get('/github/callback', authController.githubAuthCallback);

// Get current user
router.get('/me', authenticate, authController.getMe);

// Refresh token
router.post('/refresh', authLimiter, authController.refreshToken);

// Logout
router.post('/logout', authenticate, authController.logout);

export default router;
