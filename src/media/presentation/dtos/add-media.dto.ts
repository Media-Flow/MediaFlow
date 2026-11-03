import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MediaType } from '../../domain';
import { ApiProperty } from '@nestjs/swagger';

export class AddMediaDto {
  @ApiProperty({
    type: String,
    description: 'The title of the media',
    example: "Feet Don't Fail Me Now",
    maxLength: 256,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  title: string;

  @ApiProperty({
    type: String,
    description: 'The description of the media',
    example: 'Song',
    maxLength: 256,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  description: string;

  @ApiProperty({
    type: Number,
    description: 'Media size in megabytes',
    example: 12,
  })
  @IsNotEmpty()
  @IsNumber({ allowNaN: false })
  mediaSize: number; //MB

  @ApiProperty({
    enum: MediaType,
    enumName: 'MediaType',
    description: 'Media content type',
    example: MediaType.VIDEO,
  })
  @IsNotEmpty()
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiProperty({ type: Boolean, example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
