import { Inject, Injectable } from '@nestjs/common';
import { IdentityProvider } from '../../application/ports/identity-provider.port';
import { WorkOS } from '@workos-inc/node';
import { WORKOS_PROVIDER } from '../../../shared/infrastructure/auth/workos/workos.provider';
import { Role } from '../../domain/constants';

@Injectable()
export class WorkosIdentityProvider implements IdentityProvider {
  constructor(@Inject(WORKOS_PROVIDER) readonly workos: WorkOS) {}
  async syncRole(
    externalId: string,
    role: Role,
    userId: string,
  ): Promise<void> {
    await this.workos.userManagement.updateUser({
      userId: externalId,
      externalId: userId,
      metadata: { role },
    });
  }

  async syncDeleteUser(externalId: string): Promise<void> {
    const paginatedSessions =
      await this.workos.userManagement.listSessions(externalId);
    const sessions = await paginatedSessions.autoPagination();
    for (const session of sessions) {
      await this.workos.userManagement.revokeSession({
        sessionId: session.id,
      });
    }
    await this.workos.userManagement.deleteUser(externalId);
  }
}
