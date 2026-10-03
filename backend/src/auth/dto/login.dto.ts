import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { IsSupportedPassword } from "../password-length.validator";

export class LoginDto {
    @ApiProperty({ example: "admin@qualitytrack.local", maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({ description: "Contraseña de hasta 72 bytes UTF-8.", maxLength: 72 })
    @IsString()
    @IsNotEmpty()
    @IsSupportedPassword()
    password: string;

    @ApiPropertyOptional({
        description: "Sin esto la sesión vale solo en esa pestaña; con esto sobrevive al cierre del navegador",
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
