import { ApiProperty } from '@nestjs/swagger';
import {
  CommercialActorDto,
  QuotationResponseDto,
  RequestResponseDto,
} from '../commercial/commercial-response.dto';
import { ClientResponseDto } from '../clients/dto/client-response.dto';
import { WorkOrderFieldsDto } from './work-order.dto';
export class WorkOrderResponseDto extends WorkOrderFieldsDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderNumber: number;
  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  status: string;
  @ApiProperty({ nullable: true, type: Number }) quotationId: number | null;
  @ApiProperty({ nullable: true, type: QuotationResponseDto })
  quotation: QuotationResponseDto | null;
  @ApiProperty({ nullable: true, type: Number }) requestId: number | null;
  @ApiProperty({ nullable: true, type: RequestResponseDto })
  request: RequestResponseDto | null;
  @ApiProperty({ nullable: true, type: Number }) clientId: number | null;
  @ApiProperty({ nullable: true, type: ClientResponseDto })
  client: ClientResponseDto | null;
  @ApiProperty({ enum: ['linked', 'missing'] }) originStatus: string;
  @ApiProperty() createdById: number;
  @ApiProperty({ type: CommercialActorDto }) createdBy: CommercialActorDto;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true, type: String }) updatedAt: string | null;
  @ApiProperty({ nullable: true, type: String }) actualStartDate: string | null;
  @ApiProperty({ nullable: true, type: String }) actualEndDate: string | null;
}
export class ApprovalActorDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
}
export class ApprovalResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] }) status: string;
  @ApiProperty({ nullable: true, type: Number }) decidedById: number | null;
  @ApiProperty({ nullable: true, type: ApprovalActorDto })
  decidedBy: ApprovalActorDto | null;
  @ApiProperty({ nullable: true, type: String }) decisionAt: string | null;
  @ApiProperty({ nullable: true, type: String }) comments: string | null;
}
