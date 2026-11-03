import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';
import { MediaFilter } from '../ports/media.repository.port';
@Injectable()
export class GetMedia {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
  ) {}
  async execute(id: string, filter: MediaFilter) {
    const data = await this.mediaRepository.findOne(id, filter);
    if (!data) throw new NotFoundException(`Media with id ${id} not found`);
    return data;
  }
}
