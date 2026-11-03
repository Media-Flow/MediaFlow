import { Inject, Injectable } from '@nestjs/common';
import { Media } from '../../domain';
import type { Page, PageRequest } from '../../../shared/application/pagination';
import type {
  MediaFilter,
  MediaRepositoryPort,
} from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';

@Injectable()
export class ListMedia {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
  ) {}
  async execute(
    filter: MediaFilter,
    pagination: PageRequest,
  ): Promise<Page<Media>> {
    return this.mediaRepository.findMany(filter, pagination);
  }
}
