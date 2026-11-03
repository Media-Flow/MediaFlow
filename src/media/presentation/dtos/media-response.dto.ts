import { Media, MediaType } from '../../domain';
import { ApiProperty } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Media identifier' })
  id: string;

  @ApiProperty({ example: "Feet Don't Fail Me Now" })
  title: string;

  @ApiProperty({ example: 'Live performance recording' })
  description: string;

  @ApiProperty({
    enum: MediaType,
    enumName: 'MediaType',
    example: MediaType.VIDEO,
  })
  type: MediaType;

  @ApiProperty({
    type: Number,
    description: 'Media duration in seconds',
    example: 240,
  })
  duration: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  static fromDomain(entity: Media): MediaResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      duration: entity?.duration ?? 0,
      createdAt: entity.createdAt,
    };
  }
}
