import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
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

export class UserProfileDto {
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
    description: 'DNI de 7 u 8 dígitos; admite puntos y espacios.',
    maxLength: 8,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && /^[\d.\s]+$/.test(value)
      ? value.replace(/[.\s]/g, '')
      : value,
  )
  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: 'El DNI debe tener 7 u 8 dígitos numéricos.',
  })
  dni: string;
}

export class UpdateUserDto extends PartialType(UserProfileDto, {
  skipNullProperties: false,
}) {}

export class UserStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class CreateUserDto extends UserProfileDto {
  @ApiProperty({
    minimum: 1,
    maximum: 2147483647,
    description: 'ID de un rol existente.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  roleId: number;

  @ApiProperty({
    maxLength: 72,
    description:
      'Contraseña de hasta 72 bytes UTF-8; se conserva sin recortar espacios.',
  })
  @IsString()
  @IsSupportedPassword()
  password: string;
}
