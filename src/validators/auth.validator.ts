import { z } from 'zod';

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});

export const getMeSchema = z.object({
  query: z.object({}),
});

export const logoutSchema = z.object({
  body: z.object({}),
});
