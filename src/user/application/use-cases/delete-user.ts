import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import type { UserRepository } from '../ports/user.repository.port';
import { IDENTITY_PROVIDER } from '../ports/identity-provider.port';
import type { IdentityProvider } from '../ports/identity-provider.port';

@Injectable()
export class DeleteUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.identityProvider.syncDeleteUser(user.sub!);
    await this.userRepository.deleteUser(userId);
  }
}
