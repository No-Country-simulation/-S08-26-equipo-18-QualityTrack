import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
}

export class UserResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: RoleResponseDto }) role: RoleResponseDto;
}
