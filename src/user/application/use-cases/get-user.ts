import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import type { UserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/user.entity';

@Injectable()
export class GetUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async executeBySub(sub: string): Promise<User> {
    const user = await this.userRepository.findBySub(sub);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
