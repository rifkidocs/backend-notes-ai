import { Router } from 'express';
import authRoutes from './auth.routes';
import notesRoutes from './notes.routes';
import sharingRoutes from './sharing.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);
router.use('/notes', sharingRoutes); // Sharing routes are under /notes/:id/sharing
router.use('/ai', aiRoutes);

export default router;
