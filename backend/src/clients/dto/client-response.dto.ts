import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Client } from "../../entities/Client";

// Igual que en auth: estas clases publican la forma de la respuesta en OpenAPI;
// lo que se devuelve son objetos planos.
export class ClientResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: "Metalúrgica del Sur S.A." })
    businessName: string;

    @ApiProperty({ example: "30712345671" })
    taxId: string;

    @ApiProperty({ example: "compras@metalurgicadelsur.com" })
    email: string;

    @ApiProperty({ example: "+54 11 4555-1234" })
    phone: string;

    @ApiPropertyOptional({ example: "Ana Gómez" })
    contactName?: string;

    @ApiPropertyOptional({ example: "Av. Mitre 1234" })
    address?: string;

    @ApiPropertyOptional({ example: "Avellaneda" })
    city?: string;

    @ApiPropertyOptional({ example: "Buenos Aires" })
    province?: string;

    @ApiPropertyOptional()
    notes?: string;

    @ApiProperty({ description: "Un cliente desactivado no se lista ni se ofrece para trabajos nuevos" })
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ nullable: true })
    updatedAt: Date | null;
}

export class ClientPageResponseDto {
    @ApiProperty({ type: [ClientResponseDto] })
    items: ClientResponseDto[];

    @ApiProperty({ description: "Total de clientes que coinciden, no los de esta página", example: 143 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;
}

export function toClientResponse(client: Client): ClientResponseDto {
    return {
        id: client.id,
        businessName: client.businessName,
        taxId: client.taxId,
        email: client.email,
        phone: client.phone,
        contactName: client.contactName,
        address: client.address,
        city: client.city,
        province: client.province,
        notes: client.notes,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt ?? null,
    };
}
