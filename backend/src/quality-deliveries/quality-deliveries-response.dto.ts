import { ApiProperty } from '@nestjs/swagger';
export class QualityDeliveryActorDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() role: string;
}
export class QualityDeliveryOrderDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderNumber: number;
  @ApiProperty() title: string;
  @ApiProperty() status: string;
}
export class QualityOperationDto {
  @ApiProperty() id: number;
  @ApiProperty() routeSheetId: number;
  @ApiProperty() operationNumber: string;
  @ApiProperty() name: string;
}
export class DeliveryClientDto {
  @ApiProperty() id: number;
  @ApiProperty() businessName: string;
  @ApiProperty() taxId: string;
  @ApiProperty() isActive: boolean;
}
export class QualityResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty({ type: QualityDeliveryOrderDto })
  workOrder: QualityDeliveryOrderDto;
  @ApiProperty({ type: Number, nullable: true }) operationId: number | null;
  @ApiProperty({ type: QualityOperationDto, nullable: true })
  operation: QualityOperationDto | null;
  @ApiProperty({ type: String, nullable: true }) specification: string | null;
  @ApiProperty({ type: String, nullable: true }) expectedValue: string | null;
  @ApiProperty({ type: String, nullable: true }) measuredValue: string | null;
  @ApiProperty({ type: String, nullable: true }) unit: string | null;
  @ApiProperty({ type: String, nullable: true }) observations: string | null;
  @ApiProperty() performedById: number;
  @ApiProperty({ type: QualityDeliveryActorDto })
  performedBy: QualityDeliveryActorDto;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  performedAt: string | null;
  @ApiProperty({ type: QualityDeliveryActorDto, nullable: true })
  updatedBy: QualityDeliveryActorDto | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  updatedAt: string | null;
}
export class DeliveryResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty({ type: QualityDeliveryOrderDto })
  workOrder: QualityDeliveryOrderDto;
  @ApiProperty({ type: Number, nullable: true }) clientId: number | null;
  @ApiProperty({ type: DeliveryClientDto, nullable: true })
  client: DeliveryClientDto | null;
  @ApiProperty({ format: 'date-time' }) deliveryDate: string;
  @ApiProperty() quantity: number;
  @ApiProperty({ type: String, nullable: true }) notes: string | null;
  @ApiProperty({ type: QualityDeliveryActorDto, nullable: true })
  createdBy: QualityDeliveryActorDto | null;
  @ApiProperty({ type: QualityDeliveryActorDto, nullable: true })
  updatedBy: QualityDeliveryActorDto | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  updatedAt: string | null;
}
