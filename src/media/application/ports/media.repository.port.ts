import { Media, MediaStatus, MediaType } from '../../domain';
import type { Page, PageRequest } from '../../../shared/application/pagination';

export const MEDIA_REPOSITORY = Symbol('MEDIA_REPOSITORY');

export interface MediaFilter {
  ownerId?: string;
  type?: MediaType;
  status?: MediaStatus[];
  includePrivate?: boolean;
}

export interface MediaRepositoryPort {
  save(media: Media): Promise<void>;
  delete(mediaId: string): Promise<void>;
  findOne(mediaId: string, filter?: MediaFilter): Promise<Media | null>;
  findMany(filter: MediaFilter, pagination: PageRequest): Promise<Page<Media>>;
  findByTitle(title: string): Promise<Media[] | null>;
}
