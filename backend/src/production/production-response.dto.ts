import { ApiProperty } from '@nestjs/swagger';
export class ProductionPersonDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() role: string;
  @ApiProperty() isActive: boolean;
}
export class MaterialResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() materialCode: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) specification: string | null;
  @ApiProperty({ type: String, nullable: true }) manufacturer: string | null;
}
export class RouteSheetResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty() routeNumber: string;
  @ApiProperty({ type: String, nullable: true }) instructions: string | null;
  @ApiProperty() createdById: number;
  @ApiProperty({ type: ProductionPersonDto }) createdBy: ProductionPersonDto;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  updatedAt: string | null;
}
export class OperationResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() routeSheetId: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty() operationNumber: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) machine: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  plannedStart: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  plannedEnd: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  actualStart: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  actualEnd: string | null;
  @ApiProperty({ type: String, nullable: true }) notes: string | null;
  @ApiProperty({ type: ProductionPersonDto, nullable: true })
  createdBy: ProductionPersonDto | null;
  @ApiProperty({ type: ProductionPersonDto, nullable: true })
  executedBy: ProductionPersonDto | null;
}
export class AssignedMaterialResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty() materialId: number;
  @ApiProperty({ type: MaterialResponseDto }) material: MaterialResponseDto;
  @ApiProperty() materialName: string;
  @ApiProperty({ type: String, nullable: true }) specification: string | null;
  @ApiProperty() quantity: string;
  @ApiProperty({ type: String, nullable: true }) lotNumber: string | null;
  @ApiProperty({ type: String, nullable: true }) unit: string | null;
  @ApiProperty({ type: String, nullable: true }) certificateNumber:
    string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  receivedAt: string | null;
  @ApiProperty({ type: String, nullable: true }) notes: string | null;
  @ApiProperty({ type: ProductionPersonDto, nullable: true })
  assignedBy: ProductionPersonDto | null;
}
export class PersonnelResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() workOrderId: number;
  @ApiProperty() userId: number;
  @ApiProperty({ type: ProductionPersonDto }) user: ProductionPersonDto;
  @ApiProperty({ format: 'date-time' }) assignedAt: string;
  @ApiProperty({ type: ProductionPersonDto, nullable: true })
  assignedBy: ProductionPersonDto | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  unassignedAt: string | null;
  @ApiProperty({ type: ProductionPersonDto, nullable: true })
  unassignedBy: ProductionPersonDto | null;
}
