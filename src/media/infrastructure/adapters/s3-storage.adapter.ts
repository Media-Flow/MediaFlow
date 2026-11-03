import { StoragePort } from '../../application/ports/storage.port';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { PART_URL_TTL_SECONDS } from '../../domain';
import { S3_STORAGE_CLIENT } from '../../../shared/infrastructure/Storage/s3/s3.provider';

export interface PresignedPartUrl {
  partNumber: number;
  url: string;
}

@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly bucket: string;
  constructor(
    @Inject(S3_STORAGE_CLIENT) private readonly client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.getOrThrow('STORAGE_UPLOAD_BUCKET');
  }
  async createMultipartUpload(key: string): Promise<string> {
    const res = await this.client.send(
      new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!res.UploadId) {
      throw new Error('Storage returned no UploadId');
    }
    return res.UploadId;
  }
  presignPartUrls(params: {
    key: string;
    uploadId: string;
    from: number;
    count: number;
  }): Promise<PresignedPartUrl[]> {
    return Promise.all(
      Array.from({ length: params.count }, async (_, i) => {
        const partNumber = params.from + i;
        const url = await getSignedUrl(
          this.client,
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: params.key,
            UploadId: params.uploadId,
            PartNumber: partNumber,
          }),
          { expiresIn: PART_URL_TTL_SECONDS },
        );
        return { partNumber, url };
      }),
    );
  }

  async completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: { PartNumber: number; ETag: string }[];
  }): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: params.key,
        UploadId: params.uploadId,
        MultipartUpload: {
          Parts: params.parts
            .sort((a, b) => a.PartNumber - b.PartNumber)
            .map((p) => ({
              ETag: p.ETag,
              PartNumber: p.PartNumber,
            })),
        },
      }),
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );
  }

  async listUploadedParts(
    key: string,
    uploadId: string,
  ): Promise<{ PartNumber: number; ETag: string }[]> {
    const response = await this.client.send(
      new ListPartsCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );

    if (response.Parts === undefined) return [];

    return response.Parts.map((part) => ({
      PartNumber: part.PartNumber!,
      ETag: part.ETag!,
    }));
  }
}
