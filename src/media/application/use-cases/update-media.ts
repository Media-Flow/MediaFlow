import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';

export interface UpdateMediaInput {
  title?: string;
  description?: string;
  isPrivate?: boolean;
}
@Injectable()
export class UpdateMedia {
  constructor(
    @Inject(MEDIA_REPOSITORY) readonly mediaRepository: MediaRepositoryPort,
  ) {}
  async execute(id: string, input: UpdateMediaInput): Promise<void> {
    const data = await this.mediaRepository.findOne(id);
    if (data === null)
      throw new NotFoundException(`Media with id ${id} not found`);
    data.updateDetails(input);
    return await this.mediaRepository.save(data);
  }
}
