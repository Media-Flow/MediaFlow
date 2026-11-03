export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface AuthenticatedIdentity {
  sealedSession: string;
  externalId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface VerifiedSession {
  authenticated: boolean;
  externalId?: string;
  appUserId?: string;
  role?: string;
  reason?: string;
}

export interface RefreshedSession {
  authenticated: boolean;
  sealedSession?: string;
  externalId?: string;
  appUserId?: string;
  role?: string;
  retryable?: boolean;
}

export interface AuthServicePort {
  login(state?: string): string;
  logout(sealedSession: string, returnTo?: string): Promise<string>;
  authenticateWithCode(code: string): Promise<AuthenticatedIdentity>;
  verifySession(sealedSession: string): Promise<VerifiedSession>;
  refreshSession(sealedSession: string): Promise<RefreshedSession>;
}
