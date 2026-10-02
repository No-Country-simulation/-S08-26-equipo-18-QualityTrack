import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
  MaxLength,
} from 'class-validator';
const integer = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
export class UploadDocumentDto {
  @ApiProperty({ type: Number, required: false })
  @Transform(integer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  workOrderId?: number;
  @ApiProperty({ type: Number, required: false })
  @Transform(integer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  requestId?: number;
  @ApiProperty({ type: Number, required: false })
  @Transform(integer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quotationId?: number;
  @ApiProperty({ type: Number })
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  documentTypeId: number;
  @ApiProperty({ type: String, required: false, maxLength: 5000 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(5000)
  description?: string;
}
export class DocumentActorDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
}
export class DocumentTypeDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
}
export class DocumentResponseDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: Number, nullable: true }) workOrderId: number | null;
  @ApiProperty({ type: Number, nullable: true }) requestId: number | null;
  @ApiProperty({ type: Number, nullable: true }) quotationId: number | null;
  @ApiProperty() documentTypeId: number;
  @ApiProperty({ type: DocumentTypeDto }) documentType: DocumentTypeDto;
  @ApiProperty() fileName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() fileSize: number;
  @ApiProperty() version: number;
  @ApiProperty() uploadedById: number;
  @ApiProperty({ type: DocumentActorDto }) uploadedBy: DocumentActorDto;
  @ApiProperty({ format: 'date-time' }) uploadedAt: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty() downloadAvailable: boolean;
}
export class DocumentConfigDto {
  @ApiProperty() maxFileSize: number;
  @ApiProperty({ type: [String] }) allowedExtensions: string[];
}
