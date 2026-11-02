import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';
import { STORAGE } from '../ports/storage.port';
import type { StoragePort } from '../ports/storage.port';
import { Media, MediaType, PART_SIZE } from '../../domain';
import { randomUUID } from 'node:crypto';
import { PresignedPartUrl } from '../../infrastructure/adapters/s3-storage.adapter';
import { AppLogger } from '../../../shared/infrastructure/logging/app-logger.service';
import { APP_LOGGER } from '../../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../../shared/application/ports/logger.port';

export interface AddMediaInput {
  ownerId: string;
  title: string;
  description: string;
  mediaSize: number;
  isPrivate?: boolean;
  mediaType: MediaType;
}

export interface AddMediaOutput {
  mediaId: string;
  partSize: number;
  totalParts: number;
  uploadId: string;
  uploadUrls: PresignedPartUrl[];
}

@Injectable()
export class AddMedia {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
    @Inject(STORAGE) private readonly storageService: StoragePort,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) { }
  async execute(input: AddMediaInput): Promise<AddMediaOutput> {
    const data = await this.mediaRepository.findByTitle(input.title);
    if (data?.length! > 0)
      throw new ConflictException('Media already exists with this title');

    const totalParts = Math.ceil(input.mediaSize / PART_SIZE);
    const media: Media = Media.create({
      id: randomUUID(),
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      type: input.mediaType,
      size: input.mediaSize,
      totalParts: totalParts,
      isPrivate: input.isPrivate,
    });

    this.logger.log(AddMedia.name, `Starting upload for mediaId=${media.id}`);
    await this.mediaRepository.save(media);

    const UploadId = await this.storageService.createMultipartUpload(
      media.sourceKey,
    );

    media.attachUploadId(UploadId);

    await this.mediaRepository.save(media);
    this.logger.log(
      AddMedia.name,
      `Multipart upload initialized for mediaId=${media.id}; status=${media.status}`,
    );

    const urls = await this.storageService.presignPartUrls({
      key: media.sourceKey,
      uploadId: media.uploadId!,
      from: 1,
      count: Math.min(20, totalParts),
    });

    return {
      mediaId: media.id,
      uploadUrls: urls,
      partSize: PART_SIZE,
      uploadId: UploadId,
      totalParts: totalParts,
    };
  }
}
