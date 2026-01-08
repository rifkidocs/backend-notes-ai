import { Router } from 'express';
import * as sharingController from '../controllers/sharing.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Get sharing settings (authenticated)
router.get('/:id/sharing', authenticate, generalLimiter, sharingController.getSharingSettings);

// Make note public
router.post('/:id/sharing/public', authenticate, generalLimiter, sharingController.makePublic);

// Remove public access
router.delete('/:id/sharing/public', authenticate, generalLimiter, sharingController.removePublic);

// Invite user by email
router.post('/:id/sharing/invite', authenticate, generalLimiter, sharingController.inviteUser);

// Accept invite
router.post('/invite/accept/:token', authenticate, generalLimiter, sharingController.acceptInvite);

// Remove user access
router.delete('/:id/sharing/:accessId', authenticate, generalLimiter, sharingController.removeAccess);

// Update access level
router.patch('/:id/sharing/:accessId', authenticate, generalLimiter, sharingController.updateAccess);

// Get public note (optional authentication)
router.get('/public/:id', optionalAuthenticate, generalLimiter, sharingController.getPublicNote);

export default router;
