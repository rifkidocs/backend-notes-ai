import jwt from 'jsonwebtoken';
import { Provider } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

interface OAuthProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
}

export class AuthService {
  generateTokens(userId: string) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new AppError(500, 'JWT secrets not configured');
    }

    const payload = { userId };

    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async findOrCreateUser(profile: OAuthProfile, provider: Provider): Promise<{ id: string; email: string; name: string | null; avatar: string | null; provider: string }> {
    const user = await prisma.user.upsert({
      where: {
        providerId: profile.id,
      },
      update: {
        lastLoginAt: new Date(),
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        provider,
        providerId: profile.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
    });

    return user;
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  verifyRefreshToken(token: string): { id: string } {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(500, 'JWT refresh secret not configured');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as { id: string };
      return decoded;
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }
  }
}

export default new AuthService();
