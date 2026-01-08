import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GithubStrategy } from 'passport-github2';
import { Provider } from '@prisma/client';
import authService from '../services/auth.service';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await authService.findOrCreateUser(
          {
            id: profile.id,
            email: profile.emails?.[0].value || '',
            name: profile.displayName,
            avatar: profile.photos?.[0].value,
          },
          Provider.GOOGLE
        );
        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await authService.findOrCreateUser(
          {
            id: profile.id,
            email: profile.emails?.[0].value || '',
            name: profile.displayName || profile.username,
            avatar: profile.photos?.[0].value,
          },
          Provider.GITHUB
        );
        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

export default passport;
