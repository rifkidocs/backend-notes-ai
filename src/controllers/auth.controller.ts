import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    if (err) {
      logger.error('Google auth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message)}`);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Authentication failed`);
    }

    const tokens = authService.generateTokens(user.id);

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  })(req, res, next);
};

export const githubAuth = passport.authenticate('github', {
  scope: ['user:email'],
});

export const githubAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate('github', { session: false }, (err: any, user: any) => {
    if (err) {
      logger.error('GitHub auth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message)}`);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Authentication failed`);
    }

    const tokens = authService.generateTokens(user.id);

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  })(req, res, next);
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
      return;
    }

    const { id } = authService.verifyRefreshToken(refreshToken);
    const tokens = authService.generateTokens(id);

    res.json(tokens);
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // In a stateless JWT system, logout is handled client-side by deleting tokens
  // However, you can implement token blacklisting if needed
  res.json({
    message: 'Logged out successfully',
  });
};
