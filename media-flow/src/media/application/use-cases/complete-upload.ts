import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { STORAGE } from '../ports/storage.port';
import type { StoragePort } from '../ports/storage.port';
import type { MediaRepositoryPort } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../ports/media.repository.port';
import { MediaStatus } from '../../domain';
import { APP_LOGGER } from '../../../shared/application/ports/logger.port';
import type { LoggerPort } from '../../../shared/application/ports/logger.port';

@Injectable()
export class CompleteUpload {
  constructor(
    @Inject(STORAGE) private readonly storageService: StoragePort,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: MediaRepositoryPort,
    @Inject(APP_LOGGER) private readonly logger: LoggerPort,
  ) {}
  async execute(mediaId: string): Promise<void> {
    this.logger.log(
      CompleteUpload.name,
      `Upload completion requested for mediaId=${mediaId}`,
    );

    try {
      const media = await this.mediaRepository.findOne(mediaId);
      if (!media) {
        this.logger.warn(
          CompleteUpload.name,
          `Upload completion rejected: mediaId=${mediaId} was not found`,
        );
        throw new NotFoundException('Media not found');
      }

      if (
        media.status === MediaStatus.PROCESSING ||
        media.status === MediaStatus.READY
      ) {
        this.logger.log(
          CompleteUpload.name,
          `Upload already completed for mediaId=${mediaId}; status=${media.status}`,
        );
        return;
      }

      if (!media.uploadId) {
        this.logger.warn(
          CompleteUpload.name,
          `Upload completion rejected: mediaId=${mediaId} has no uploadId`,
        );
        throw new BadRequestException('Media upload has not been initialized');
      }

      const uploadedParts = await this.storageService.listUploadedParts(
        media.sourceKey,
        media.uploadId,
      );

      if (uploadedParts.length === 0) {
        this.logger.warn(
          CompleteUpload.name,
          `Upload completion rejected: no uploaded parts for mediaId=${mediaId}`,
        );
        throw new BadRequestException('No uploaded parts found');
      }

      this.logger.log(
        CompleteUpload.name,
        `Completing S3 multipart upload for mediaId=${mediaId} with ${uploadedParts.length} parts`,
      );
      await this.storageService.completeMultipartUpload({
        key: media.sourceKey,
        uploadId: media.uploadId,
        parts: uploadedParts,
      });

      media.startProcessing();
      await this.mediaRepository.save(media);

      this.logger.log(
        CompleteUpload.name,
        `Upload completed for mediaId=${mediaId}; status=${media.status}`,
      );
    } catch (error) {
      if (
        !(error instanceof NotFoundException) &&
        !(error instanceof BadRequestException)
      ) {
        this.logger.error(
          CompleteUpload.name,
          `Upload completion failed for mediaId=${mediaId}`,
          error,
        );
      }
      throw error;
    }
  }
}
