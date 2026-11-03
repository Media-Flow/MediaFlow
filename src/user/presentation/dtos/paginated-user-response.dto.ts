import { ApiProperty } from '@nestjs/swagger';
import type { Page } from '../../../shared/application/pagination';
import { User } from '../../domain/user.entity';
import { UserResponseDto } from './user-response.dto';

export class PaginatedUserResponseDto {
  @ApiProperty({ type: UserResponseDto, isArray: true })
  items: UserResponseDto[];

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Pass as ?cursor= to get the next page. null on the last page.',
  })
  nextCursor: string | null;

  static fromPage(page: Page<User>): PaginatedUserResponseDto {
    const dto = new PaginatedUserResponseDto();
    dto.items = page.items.map((user) => UserResponseDto.fromDomain(user));
    dto.nextCursor = page.nextCursor;
    return dto;
  }
}
