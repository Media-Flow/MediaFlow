import { Inject, Injectable } from '@nestjs/common';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';
@Injectable()
export class DeleteMedia {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
  ) {}
  async execute(id: string): Promise<void> {
    await this.mediaRepository.delete(id);
  }
}
