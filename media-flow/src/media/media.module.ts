import { Module } from '@nestjs/common';
import { MEDIA_REPOSITORY } from './application/ports/media.repository.port';
import { DrizzleMediaRepository } from './infrastructure/adapters/drizzle-media.repository';
import { MediaController } from './presentation/media.controller';
import { AddMedia } from './application/use-cases/add-media';
import { CompleteUpload } from './application/use-cases/complete-upload';
import { GetMedia } from './application/use-cases/get-media';
import { DeleteMedia } from './application/use-cases/delete-media';
import { ListMedia } from './application/use-cases/list-media';
import { UpdateMedia } from './application/use-cases/update-media';
import { GetUploadPartUrls } from './application/use-cases/get-upload-part-urls';
import { STORAGE } from './application/ports/storage.port';
import { S3StorageAdapter } from './infrastructure/adapters/s3-storage.adapter';
import { OutBoxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutBoxModule],
  providers: [
    {
      provide: MEDIA_REPOSITORY,
      useClass: DrizzleMediaRepository,
    },
    {
      provide: STORAGE,
      useClass: S3StorageAdapter,
    },
    AddMedia,
    CompleteUpload,
    GetMedia,
    DeleteMedia,
    ListMedia,
    UpdateMedia,
    GetUploadPartUrls,
  ],
  controllers: [MediaController],
})
export class MediaModule {}
