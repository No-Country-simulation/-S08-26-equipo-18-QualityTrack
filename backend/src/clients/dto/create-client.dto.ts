import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { IsCuit } from "../cuit";

// Se normaliza antes de validar: si no, un correo pegado con un espacio al final
// se rechaza por inválido en lugar de recortarse.
const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

export class CreateClientDto {
    @ApiProperty({ example: "Metalúrgica del Sur S.A.", maxLength: 1000 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    businessName: string;

    @ApiProperty({
        description: "Once dígitos. Se aceptan guiones y puntos: se guardan solo los dígitos",
        example: "30712345671",
    })
    @IsCuit()
    taxId: string;

    @ApiProperty({ example: "compras@metalurgicadelsur.com", maxLength: 255 })
    @Transform(trimLower)
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({ example: "+54 11 4555-1234", maxLength: 255 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    phone: string;

    @ApiPropertyOptional({ example: "Ana Gómez", maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactName?: string;

    @ApiPropertyOptional({ example: "Av. Mitre 1234", maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional({ example: "Avellaneda", maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    city?: string;

    @ApiPropertyOptional({ example: "Buenos Aires", maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    province?: string;

    @ApiPropertyOptional({ maxLength: 5000 })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notes?: string;
}
