import { Response } from 'express';
import { AuthenticatedRequest } from '../models/express.types';
import sharingService from '../services/sharing.service';
import logger from '../utils/logger';

export const getSharingSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;

    const settings = await sharingService.getSharingSettings(id as string, req.user.id);

    res.json(settings);
  } catch (error: any) {
    logger.error('Get sharing settings error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get sharing settings',
      });
    }
  }
};

export const makePublic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    const { accessLevel } = req.body;

    const note = await sharingService.makeNotePublic(id as string, req.user.id, accessLevel);

    res.json(note);
  } catch (error: any) {
    logger.error('Make note public error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to make note public',
      });
    }
  }
};

export const removePublic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;

    const note = await sharingService.removePublicAccess(id as string, req.user.id);

    res.json(note);
  } catch (error: any) {
    logger.error('Remove public access error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove public access',
      });
    }
  }
};

export const inviteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    const { email, accessLevel } = req.body;

    const sharedAccess = await sharingService.inviteUserByEmail(id as string, req.user.id, email, accessLevel);

    res.status(201).json(sharedAccess);
  } catch (error: any) {
    logger.error('Invite user error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to invite user',
      });
    }
  }
};

export const acceptInvite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { token } = req.params;

    const sharedAccess = await sharingService.acceptInvite(token as string, req.user.id);

    res.json(sharedAccess);
  } catch (error: any) {
    logger.error('Accept invite error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to accept invite',
      });
    }
  }
};

export const removeAccess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id, accessId } = req.params;

    await sharingService.removeUserAccess(id as string, accessId as string, req.user.id);

    res.json({ message: 'Access removed successfully' });
  } catch (error: any) {
    logger.error('Remove access error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove access',
      });
    }
  }
};

export const updateAccess = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id, accessId } = req.params;
    const { accessLevel } = req.body;

    const sharedAccess = await sharingService.updateAccessLevel(id as string, accessId as string, req.user.id, accessLevel);

    res.json(sharedAccess);
  } catch (error: any) {
    logger.error('Update access error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update access',
      });
    }
  }
};

export const getPublicNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await sharingService.getPublicNote(id as string);

    res.json(note);
  } catch (error: any) {
    logger.error('Get public note error:', error);

    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error.statusCode === 403) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get public note',
      });
    }
  }
};
