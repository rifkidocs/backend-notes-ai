import { Router } from 'express';
import * as notesController from '../controllers/notes.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.get('/', generalLimiter, notesController.getNotes);
router.get('/shared', generalLimiter, notesController.getSharedNotes);
router.get('/:id', generalLimiter, notesController.getNoteById);
router.post('/', generalLimiter, notesController.createNote);
router.patch('/:id', generalLimiter, notesController.updateNote);
router.delete('/:id', generalLimiter, notesController.deleteNote);

// Archive and restore
router.patch('/:id/archive', generalLimiter, notesController.archiveNote);
router.patch('/:id/restore', generalLimiter, notesController.restoreNote);

export default router;
