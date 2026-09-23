import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class LoginDto {
    @ApiProperty({ example: "admin@qualitytrack.local", maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({ maxLength: 200 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    password: string;

    @ApiPropertyOptional({
        description: "Sin esto la sesión vale solo en esa pestaña; con esto sobrevive al cierre del navegador",
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
