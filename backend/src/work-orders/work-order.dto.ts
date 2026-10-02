import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { WorkOrderPriority } from '../entities/WorkOrderPriority';
import { WorkOrderStatus } from '../entities/WorkOrderStatus';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class WorkOrderFieldsDto {
  @ApiProperty()
  @IsString()
  @Transform(trim)
  @IsNotEmpty()
  @MaxLength(500)
  title: string;
  @ApiProperty()
  @IsString()
  @Transform(trim)
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
  @ApiProperty({ enum: WorkOrderPriority })
  @IsEnum(WorkOrderPriority)
  priority: WorkOrderPriority;
  @ApiProperty()
  @IsString()
  @IsDateString({ strict: true })
  plannedStartDate: string;
  @ApiProperty()
  @IsString()
  @IsDateString({ strict: true })
  plannedEndDate: string;
}
export class CreateWorkOrderDto extends WorkOrderFieldsDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) quotationId: number;
}
export class UpdateWorkOrderDto extends PartialType(WorkOrderFieldsDto, {
  skipNullProperties: false,
}) {
  @ApiProperty({ required: false, enum: WorkOrderStatus })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  actualStartDate?: string | null;
  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  actualEndDate?: string | null;
}
export class DecideApprovalDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum({ APPROVED: 'APPROVED', REJECTED: 'REJECTED' })
  status: 'APPROVED' | 'REJECTED';
  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(5000)
  comments?: string | null;
}
export class CreateApprovalDto extends DecideApprovalDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
}
