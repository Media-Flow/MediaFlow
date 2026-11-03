import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MediaUpdateDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Updated media title',
    example: "Feet Don't Fail Me Now",
  })
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Updated media description',
    example: 'Live performance recording',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether the media is private',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;
}
