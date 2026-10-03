import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ValidateBy,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { decimalCents } from './decimal';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const Decimal = (positive = false) =>
  ValidateBy({
    name: 'commercialDecimal',
    validator: {
      validate: (value: unknown) => {
        try {
          const cents = decimalCents(value);
          return positive ? cents > 0n : cents >= 0n;
        } catch {
          return false;
        }
      },
      defaultMessage: () =>
        'El importe o cantidad debe ser válido, sin signos ni exponentes, con hasta 12 enteros y 2 decimales.',
    },
  });

export class CreateRequestDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) clientId: number;
  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;
  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
  @ApiProperty() @IsString() @IsDateString({ strict: true }) receivedAt: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  requestedDeliveryDate?: string | null;
}
export class UpdateRequestDto extends PartialType(CreateRequestDto, {
  skipNullProperties: false,
}) {
  @ApiProperty({
    required: false,
    description: 'Identificador inmutable; no admite un valor diferente.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  requestNumber?: string;
}

export class QuotationItemDto {
  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
  @ApiProperty({
    description: 'Cantidad positiva con hasta dos decimales.',
    oneOf: [
      { type: 'number' },
      { type: 'string', pattern: '^\\d{1,12}(\\.\\d{1,2})?$' },
    ],
  })
  @Decimal(true)
  quantity: number | string;
  @ApiProperty({
    description: 'Precio no negativo con hasta dos decimales.',
    oneOf: [
      { type: 'number' },
      { type: 'string', pattern: '^\\d{1,12}(\\.\\d{1,2})?$' },
    ],
  })
  @Decimal()
  unitPrice: number | string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
export class CreateQuotationDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) clientId: number;
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) requestId: number;
  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  version: number;
  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
  @ApiProperty({ enum: ['ARS', 'USD'] }) @IsIn(['ARS', 'USD']) currency: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  validUntil?: string | null;
  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
}
export class UpdateQuotationDto extends PartialType(CreateQuotationDto, {
  skipNullProperties: false,
}) {
  @ApiProperty({
    required: false,
    description: 'Identificador inmutable; no admite un valor diferente.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quotationNumber?: string;
}
export class QuotationDecisionDto {
  @ApiProperty({ enum: ['accepted', 'rejected'] })
  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';
}
