import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import type { UserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/user.entity';
import type { Page, PageRequest } from '../../../shared/application/pagination';

@Injectable()
export class ListUsers {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  execute(pagination: PageRequest): Promise<Page<User>> {
    return this.userRepository.findAll(pagination);
  }
}
