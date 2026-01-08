import { Response } from 'express';
import { AuthenticatedRequest } from '../models/express.types';
import aiService from '../services/ai.service';
import logger from '../utils/logger';

export const generateContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { prompt, context, noteId } = req.body;

    if (!prompt) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Prompt is required',
      });
      return;
    }

    const result = await aiService.generateContent(prompt, context);

    // Save generation history if noteId is provided
    if (noteId) {
      await aiService.saveGeneration(noteId, prompt, result.content, result.model);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Generate content error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate content',
    });
  }
};

export const continueWriting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { currentContent } = req.body;

    if (!currentContent) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Current content is required',
      });
      return;
    }

    const result = await aiService.continueWriting(currentContent);

    res.json(result);
  } catch (error: any) {
    logger.error('Continue writing error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to continue writing',
    });
  }
};

export const summarizeDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { content } = req.body;

    if (!content) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Content is required',
      });
      return;
    }

    const result = await aiService.summarizeDocument(content);

    res.json(result);
  } catch (error: any) {
    logger.error('Summarize document error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to summarize document',
    });
  }
};

export const expandSection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { section, topic } = req.body;

    if (!section || !topic) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Section and topic are required',
      });
      return;
    }

    const result = await aiService.expandSection(section, topic);

    res.json(result);
  } catch (error: any) {
    logger.error('Expand section error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to expand section',
    });
  }
};

export const fixGrammar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { text } = req.body;

    if (!text) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required',
      });
      return;
    }

    const result = await aiService.fixGrammar(text);

    res.json(result);
  } catch (error: any) {
    logger.error('Fix grammar error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fix grammar',
    });
  }
};

export const generateBlogPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { topic, tone } = req.body;

    if (!topic) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Topic is required',
      });
      return;
    }

    const result = await aiService.generateBlogPost(topic, tone);

    res.json(result);
  } catch (error: any) {
    logger.error('Generate blog post error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate blog post',
    });
  }
};

export const generateOutline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { topic } = req.body;

    if (!topic) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Topic is required',
      });
      return;
    }

    const result = await aiService.generateOutline(topic);

    res.json(result);
  } catch (error: any) {
    logger.error('Generate outline error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate outline',
    });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { noteId } = req.params;

    const history = await aiService.getGenerationHistory(noteId);

    res.json(history);
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get generation history',
    });
  }
};
