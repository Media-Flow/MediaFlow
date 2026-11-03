import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StoragePort } from '../ports/storage.port';
import { STORAGE } from '../ports/storage.port';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';
import { PresignedPartUrl } from 'src/media/infrastructure/adapters/s3-storage.adapter';

@Injectable()
export class GetUploadPartUrls {
  constructor(
    @Inject(STORAGE) private readonly storageService: StoragePort,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
  ) {}
  async execute(
    mediaId: string,
    from: number,
    count: number,
  ): Promise<PresignedPartUrl[]> {
    const media = await this.mediaRepository.findOne(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return await this.storageService.presignPartUrls({
      key: media.sourceKey,
      uploadId: media.uploadId!,
      from: from,
      count: count,
    });
  }
}
