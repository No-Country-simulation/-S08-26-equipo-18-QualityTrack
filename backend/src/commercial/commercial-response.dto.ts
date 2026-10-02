import { ApiProperty } from '@nestjs/swagger';
import { ClientResponseDto } from '../clients/dto/client-response.dto';

export class CommercialActorDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}
export class RequestResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() clientId: number;
  @ApiProperty({ type: ClientResponseDto }) client: ClientResponseDto;
  @ApiProperty() requestNumber: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() receivedAt: string;
  @ApiProperty({ nullable: true, type: String }) requestedDeliveryDate:
    string | null;
  @ApiProperty() createdById: number;
  @ApiProperty({ type: CommercialActorDto }) createdBy: CommercialActorDto;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true, type: String }) updatedAt: string | null;
}
export class QuotationItemResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() quotationId: number;
  @ApiProperty() description: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() subtotal: number;
  @ApiProperty({ nullable: true, type: String }) notes: string | null;
}
export class QuotationResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() clientId: number;
  @ApiProperty({ type: ClientResponseDto }) client: ClientResponseDto;
  @ApiProperty() requestId: number;
  @ApiProperty({ type: RequestResponseDto }) request: RequestResponseDto;
  @ApiProperty() quotationNumber: string;
  @ApiProperty() version: number;
  @ApiProperty() description: string;
  @ApiProperty() subtotal: string;
  @ApiProperty() taxAmount: string;
  @ApiProperty() total: string;
  @ApiProperty({ enum: ['ARS', 'USD'] }) currency: string;
  @ApiProperty({ type: String, nullable: true }) validUntil: string | null;
  @ApiProperty({ type: [QuotationItemResponseDto] })
  items: QuotationItemResponseDto[];
  @ApiProperty() createdById: number;
  @ApiProperty({ type: CommercialActorDto }) createdBy: CommercialActorDto;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true, type: String }) updatedAt: string | null;
  @ApiProperty({ enum: ['pending', 'accepted', 'rejected'] }) decisionStatus:
    'pending' | 'accepted' | 'rejected';
  @ApiProperty({ nullable: true, type: Number }) decidedById: number | null;
  @ApiProperty({ nullable: true, type: CommercialActorDto })
  decidedBy: CommercialActorDto | null;
  @ApiProperty({ nullable: true, type: String }) decidedAt: string | null;
}
