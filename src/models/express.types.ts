import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    provider: string;
  };
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string | null;
      avatar: string | null;
      provider: string;
    };
  }
}
