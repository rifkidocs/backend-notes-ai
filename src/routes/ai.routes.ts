import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Apply AI rate limiter to all routes
router.use(aiLimiter);

// Content generation
router.post('/generate', aiController.generateContent);
router.post('/continue', aiController.continueWriting);
router.post('/summarize', aiController.summarizeDocument);
router.post('/expand', aiController.expandSection);
router.post('/grammar', aiController.fixGrammar);
router.post('/blog', aiController.generateBlogPost);
router.post('/outline', aiController.generateOutline);

// History
router.get('/history/:noteId', aiController.getHistory);

export default router;
