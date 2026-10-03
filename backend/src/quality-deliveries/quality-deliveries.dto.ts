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
} from 'class-validator';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export function qualityDecimal(value: unknown): string {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    !/^-?\d{1,10}(\.\d{1,4})?$/.test(String(value))
  )
    throw new Error(
      'Decimal inválido: hasta 10 enteros y 4 decimales, sin exponentes.',
    );
  const text = String(value),
    negative = text.startsWith('-'),
    [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.');
  const units = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
  return `${negative && units !== 0n ? '-' : ''}${units / 10000n}.${String(units % 10000n).padStart(4, '0')}`;
}
const Decimal = () =>
  ValidateBy({
    name: 'qualityDecimal',
    validator: {
      validate: (v: unknown) => {
        try {
          qualityDecimal(v);
          return true;
        } catch {
          return false;
        }
      },
      defaultMessage: () =>
        'Valor numérico inválido: hasta 10 enteros y 4 decimales, sin exponentes.',
    },
  });
const ZonedDate = () =>
  ValidateBy({
    name: 'zonedDate',
    validator: {
      validate: (v: unknown) =>
        typeof v === 'string' &&
        (/^\d{4}-\d{2}-\d{2}$/.test(v) ||
          /^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(v)),
      defaultMessage: () => 'Usá YYYY-MM-DD o una fecha ISO con zona horaria.',
    },
  });
export class CreateQualityDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
  @ApiProperty({ type: Number, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  operationId?: number | null;
  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  specification: string;
  @ApiProperty({
    required: false,
    nullable: true,
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @IsOptional()
  @Decimal()
  expectedValue?: string | number | null;
  @ApiProperty({
    required: false,
    nullable: true,
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @IsOptional()
  @Decimal()
  measuredValue?: string | number | null;
  @ApiProperty({ type: String, required: false, nullable: true, maxLength: 20 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  unit?: string | null;
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  observations?: string | null;
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  @ZonedDate()
  performedAt?: string | null;
}
export class UpdateQualityDto extends PartialType(CreateQualityDto, {
  skipNullProperties: false,
}) {}
export class CreateDeliveryDto {
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) workOrderId: number;
  @ApiProperty()
  @IsString()
  @IsDateString({ strict: true })
  @ZonedDate()
  deliveryDate: string;
  @ApiProperty({ minimum: 1, maximum: 2147483647 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity: number;
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto, {
  skipNullProperties: false,
}) {}
