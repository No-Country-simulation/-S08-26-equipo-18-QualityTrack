import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
  ValidateBy,
  ValidateIf,
} from 'class-validator';
import { decimalCents } from '../commercial/decimal';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateMaterialDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  materialCode: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  specification?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  manufacturer?: string | null;
}
export class CreateRouteSheetDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  instructions?: string | null;
}
export class UpdateRouteSheetDto {
  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  instructions?: string | null;
}
export class OperationPlanDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  machine?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  plannedStart?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  plannedEnd?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
export class CreateOperationDto extends OperationPlanDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) routeSheetId: number;
}
export class UpdateOperationDto extends PartialType(OperationPlanDto, {
  skipNullProperties: false,
}) {}
export class OperationExecutionDto {
  @ApiProperty({ required: false })
  @ValidateIf((_o, v) => v !== undefined)
  @IsString()
  @IsDateString({ strict: true })
  actualStart?: string;
  @ApiProperty({ required: false })
  @ValidateIf((_o, v) => v !== undefined)
  @IsString()
  @IsDateString({ strict: true })
  actualEnd?: string;
}
export class MaterialAssignmentFields {
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  @ValidateBy({
    name: 'positiveDecimal',
    validator: {
      validate: (v: unknown) => {
        try {
          return decimalCents(v) > 0n;
        } catch {
          return false;
        }
      },
      defaultMessage: () =>
        'Cantidad positiva, sin exponentes y con hasta 12 enteros y 2 decimales.',
    },
  })
  quantity: string | number;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  lotNumber?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  unit?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  certificateNumber?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  receivedAt?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
export class AssignMaterialDto extends MaterialAssignmentFields {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) materialId: number;
}
export class UpdateAssignedMaterialDto extends PartialType(
  MaterialAssignmentFields,
  { skipNullProperties: false },
) {}
export class AssignPersonnelDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) userId: number;
}
