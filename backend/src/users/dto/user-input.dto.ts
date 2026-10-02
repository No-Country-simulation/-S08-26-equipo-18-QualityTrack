import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSupportedPassword } from '../../auth/password-length.validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ChangeUserRoleDto {
  @ApiProperty({
    minimum: 1,
    maximum: 2147483647,
    description: 'ID de un rol existente.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  roleId: number;
}

export class CreateUserDto extends ChangeUserRoleDto {
  @ApiProperty({ maxLength: 255 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @ApiProperty({ maxLength: 255 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @ApiProperty({ maxLength: 255 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    maxLength: 72,
    description:
      'Contraseña de hasta 72 bytes UTF-8; se conserva sin recortar espacios.',
  })
  @IsString()
  @IsSupportedPassword()
  password: string;
}
