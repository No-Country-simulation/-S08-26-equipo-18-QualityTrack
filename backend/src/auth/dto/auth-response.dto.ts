import { ApiProperty } from "@nestjs/swagger";

// Estas clases existen solo para que OpenAPI publique la forma de las respuestas:
// el servicio devuelve objetos planos, no instancias de estas clases.

export class RoleResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: "admin" })
    name: string;

    @ApiProperty({ example: "Administrador del sistema" })
    description: string;
}

export class AuthUserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: "Ana" })
    firstName: string;

    @ApiProperty({ example: "Gómez" })
    lastName: string;

    @ApiProperty({ example: "admin@qualitytrack.local" })
    email: string;

    @ApiProperty({ type: RoleResponseDto })
    role: RoleResponseDto;
}

export class TokenPairResponseDto {
    @ApiProperty({ description: "JWT que viaja en la cabecera Authorization: Bearer" })
    accessToken: string;

    @ApiProperty({ description: "Token de renovación de un solo uso: cada refresh lo reemplaza" })
    refreshToken: string;

    @ApiProperty({ description: "Segundos de vida del token de acceso", example: 900 })
    expiresIn: number;
}

export class LoginResponseDto extends TokenPairResponseDto {
    @ApiProperty({ type: AuthUserResponseDto })
    user: AuthUserResponseDto;
}

export class MeResponseDto {
    @ApiProperty({ type: AuthUserResponseDto })
    user: AuthUserResponseDto;
}
