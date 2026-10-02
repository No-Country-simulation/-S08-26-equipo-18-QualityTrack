import { ApiProperty } from '@nestjs/swagger';
import { toAuthUser } from '../../auth/auth-user';
import { User } from '../../entities/User';

export class RoleResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
}

export class UserResponseDto {
  @ApiProperty({ type: String, nullable: true }) dni: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: RoleResponseDto }) role: RoleResponseDto;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    ...toAuthUser(user),
    dni: user.dni ?? null,
    isActive: user.isActive,
  };
}
