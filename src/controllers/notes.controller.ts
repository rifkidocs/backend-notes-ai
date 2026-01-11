import { Response } from 'express';
import { AuthenticatedRequest } from '../models/express.types';
import notesService from '../services/notes.service';
import logger from '../utils/logger';

export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { title, content } = req.body;

    const note = await notesService.createNote(req.user.id, { title, content });

    res.status(201).json(note);
  } catch (error) {
    logger.error('Create note error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create note',
    });
  }
};

export const getNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const includeDeleted = req.query.includeDeleted === 'true';

    const result = await notesService.getNotes(req.user.id, {
      page,
      limit,
      search,
      includeDeleted,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get notes error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get notes',
    });
  }
};

export const getNoteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const id = req.params.id as string;

    const note = await notesService.getNoteById(id, req.user.id);

    res.json(note);
  } catch (error: any) {
    logger.error('Get note error:', error);

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
        message: 'Failed to get note',
      });
    }
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const id = req.params.id as string;
    const { title, content, icon, coverImage } = req.body;

    const note = await notesService.updateNote(id, req.user.id, {
      title,
      content,
      icon,
      coverImage,
    });

    res.json(note);
  } catch (error: any) {
    logger.error('Update note error:', error);

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
        message: 'Failed to update note',
      });
    }
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const id = req.params.id as string;

    await notesService.deleteNote(id, req.user.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    logger.error('Delete note error:', error);

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
        message: 'Failed to delete note',
      });
    }
  }
};

export const archiveNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const id = req.params.id as string;

    const note = await notesService.archiveNote(id, req.user.id);

    res.json(note);
  } catch (error: any) {
    logger.error('Archive note error:', error);

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
        message: 'Failed to archive note',
      });
    }
  }
};

export const restoreNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const id = req.params.id as string;

    const note = await notesService.restoreNote(id, req.user.id);

    res.json(note);
  } catch (error: any) {
    logger.error('Restore note error:', error);

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
        message: 'Failed to restore note',
      });
    }
  }
};

export const getSharedNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notesService.getSharedNotes(req.user.id, { page, limit });

    res.json(result);
  } catch (error) {
    logger.error('Get shared notes error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get shared notes',
    });
  }
};
