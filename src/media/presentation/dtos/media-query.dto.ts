import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { MediaStatus, MediaType } from '../../domain';
import { PaginationInputDto } from '../../../shared/presentation/dtos/pagination-input.dto';

export class MediaQueryDto extends PaginationInputDto {
  @ApiPropertyOptional({ description: 'Filter by media owner ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: MediaType, description: 'Filter by media type' })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @ApiPropertyOptional({
    enum: MediaStatus,
    isArray: true,
    description: 'Filter by one or more media statuses',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsEnum(MediaStatus, { each: true })
  status?: MediaStatus[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether to include private media',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includePrivate?: boolean;
}
