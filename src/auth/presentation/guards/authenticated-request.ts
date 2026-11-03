import type { Request } from 'express';

export interface AuthenticatedUser {
  externalId: string;
  appUserId: string;
  role?: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
