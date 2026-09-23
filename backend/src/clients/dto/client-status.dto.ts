import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class ClientStatusDto {
    @ApiProperty({ description: "true reactiva el cliente, false lo desactiva" })
    @IsBoolean()
    isActive: boolean;
}
