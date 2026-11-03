import { PresignedPartUrl } from '../../infrastructure/adapters/s3-storage.adapter';
import { AddMediaOutput } from '../../application/use-cases/add-media';
import { ApiProperty } from '@nestjs/swagger';

export class PresignedPartUrlDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Part number (starts at 1)',
  })
  partNumber: number;

  @ApiProperty({
    type: String,
    format: 'uri',
    description: 'Presigned PUT URL for uploading this part',
    example: 'https://storage.example.com/media/part?signature=...',
  })
  url: string;
}

export class AddMediaResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identifier of the media upload',
  })
  mediaId: string;

  @ApiProperty({
    type: Number,
    description: 'Media Part Size In MB',
    example: 25,
  })
  partSize: number;

  @ApiProperty({
    type: Number,
    description: 'Total number of upload parts',
    example: 50,
  })
  totalParts: number;

  @ApiProperty({ type: PresignedPartUrlDto, isArray: true })
  uploadUrls: PresignedPartUrl[];

  @ApiProperty({ description: 'Storage multipart upload identifier' })
  uploadId: string;
  ownerId: string;

  static from(output: AddMediaOutput): AddMediaResponseDto {
    const dto = new AddMediaResponseDto();
    dto.mediaId = output.mediaId;
    dto.partSize = output.partSize;
    dto.totalParts = output.totalParts;
    dto.uploadUrls = output.uploadUrls;
    dto.uploadId = output.uploadId;
    return dto;
  }
}
