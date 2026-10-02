import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CurrentAuth } from '../auth/current-auth.decorator';
import type { RequestAuth } from '../auth/current-auth.decorator';
import { DocumentAccessGuard } from './document-access.guard';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  DocumentResponseDto,
  DocumentTypeDto,
  DocumentConfigDto,
} from './documents.dto';
import type { UploadedDocumentFile } from './document-storage';
@UseGuards(DocumentAccessGuard)
@Controller('documents')
@ApiTags('documents')
@ApiBearerAuth('access-token')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}
  @Get('config') @ApiOkResponse({ type: DocumentConfigDto }) config() {
    return this.service.config();
  }
  @Get('types')
  @ApiOkResponse({ type: DocumentTypeDto, isArray: true })
  types() {
    return this.service.types();
  }
  @Get() @ApiOkResponse({ type: DocumentResponseDto, isArray: true }) list(
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.list(auth.user);
  }
  @Get('work-order/:id')
  @ApiOkResponse({ type: DocumentResponseDto, isArray: true })
  order(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.forOrder(id, auth.user);
  }
  @Get('request/:id')
  @ApiOkResponse({ type: DocumentResponseDto, isArray: true })
  request(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.forRequest(id, auth.user);
  }
  @Get('quotation/:id')
  @ApiOkResponse({ type: DocumentResponseDto, isArray: true })
  quote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.forQuotation(id, auth.user);
  }
  @Get(':id/download')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOkResponse({
    description: 'Contenido original como attachment autenticado.',
  })
  download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.download(id, auth.user);
  }
  @Get(':id') @ApiOkResponse({ type: DocumentResponseDto }) get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.metadata(id, auth.user);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentTypeId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentTypeId: { type: 'integer' },
        workOrderId: { type: 'integer' },
        requestId: { type: 'integer' },
        quotationId: { type: 'integer' },
        description: { type: 'string', maxLength: 5000 },
      },
    },
  })
  upload(
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: UploadedDocumentFile,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.upload(dto, file, auth.user.id);
  }
}
