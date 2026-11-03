import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_STORAGE_CLIENT = Symbol('S3_STORAGE_CLIENT');
export const S3Provider = {
  provide: S3_STORAGE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): S3Client => {
    const client = new S3Client({
      endpoint: config.getOrThrow('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow('STORAGE_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow('STORAGE_SECRET_ACCESS_KEY'),
      },
      region: config.getOrThrow('STORAGE_REGION'),
    });
    return client;
  },
};
