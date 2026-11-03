export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export interface IdentityProvider {
  syncRole(externalId: string, role: string, userId: string): Promise<void>;
  syncDeleteUser(externalId: string): Promise<void>;
}
