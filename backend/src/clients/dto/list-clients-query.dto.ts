import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export enum ClientStatusFilter {
    Active = "active",
    Inactive = "inactive",
    All = "all",
}

export class ListClientsQueryDto {
    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(MAX_PAGE_SIZE)
    limit: number = DEFAULT_PAGE_SIZE;

    @ApiPropertyOptional({ description: "Coincidencia parcial sobre razón social o CUIT", maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    search?: string;

    @ApiPropertyOptional({
        enum: ClientStatusFilter,
        default: ClientStatusFilter.Active,
        description: "Los desactivados no se listan salvo que se pidan expresamente",
    })
    @IsOptional()
    @IsEnum(ClientStatusFilter)
    status: ClientStatusFilter = ClientStatusFilter.Active;
}
