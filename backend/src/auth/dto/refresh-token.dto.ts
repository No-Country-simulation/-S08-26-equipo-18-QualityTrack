import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({ description: "El último token de renovación entregado por /auth/login o /auth/refresh", maxLength: 200 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    refreshToken: string;
}
