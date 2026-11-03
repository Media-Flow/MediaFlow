import { User } from '../../domain/user.entity';
import type { Page, PageRequest } from '../../../shared/application/pagination';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(pagination: PageRequest): Promise<Page<User>>;
  findBySub(externalId: string): Promise<User | null>;
  deleteUser(userId: string): Promise<void>;
}
