import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../domain/constants';
import { User } from '../../domain/user.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true, example: null })
  sub: string | null;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.USER })
  role: Role;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  static fromDomain(user: User): UserResponseDto {
    return {
      id: user.id,
      sub: user.sub,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
