import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CurrentAuth } from '../auth/current-auth.decorator';
import type { RequestAuth } from '../auth/current-auth.decorator';
import { CommercialService } from './commercial.service';
import {
  RequestResponseDto,
  QuotationResponseDto,
} from './commercial-response.dto';
import {
  CreateRequestDto,
  UpdateRequestDto,
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationDecisionDto,
} from './commercial.dto';

@ApiTags('requests')
@ApiBearerAuth('access-token')
@ApiBadRequestResponse({ description: 'Entrada inválida.' })
@ApiConflictResponse({
  description: 'Número duplicado, cliente inactivo u origen ya cotizado.',
})
@ApiNotFoundResponse({ description: 'Registro inexistente.' })
@ApiForbiddenResponse({ description: 'El rol no permite la acción.' })
@Controller('requests')
export class RequestsController {
  constructor(private readonly commercial: CommercialService) {}
  @Get()
  @RequirePermission('requests:view')
  @ApiOperation({ summary: 'Listar solicitudes con cliente real' })
  @ApiOkResponse({ type: RequestResponseDto, isArray: true })
  list() {
    return this.commercial.requests();
  }
  @Get(':id')
  @RequirePermission('requests:view')
  @ApiOkResponse({ type: RequestResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.commercial.request(id);
  }
  @Post()
  @RequirePermission('requests:create')
  @ApiCreatedResponse({ type: RequestResponseDto })
  create(@Body() dto: CreateRequestDto, @CurrentAuth() auth: RequestAuth) {
    return this.commercial.createRequest(dto, auth.user.id);
  }
  @Put(':id')
  @RequirePermission('requests:edit')
  @ApiOkResponse({ type: RequestResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequestDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.commercial.updateRequest(id, dto, auth.user.id);
  }
}
@ApiTags('quotations')
@ApiBearerAuth('access-token')
@ApiBadRequestResponse({ description: 'Entrada, ítems o relación inválidos.' })
@ApiConflictResponse({
  description: 'Número duplicado o cotización no apta para esta acción.',
})
@ApiNotFoundResponse({ description: 'Registro inexistente.' })
@ApiForbiddenResponse({ description: 'El rol no permite la acción.' })
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly commercial: CommercialService) {}
  @Get()
  @RequirePermission('quotations:view')
  @ApiOkResponse({ type: QuotationResponseDto, isArray: true })
  list() {
    return this.commercial.quotations();
  }
  @Get(':id')
  @RequirePermission('quotations:view')
  @ApiOkResponse({ type: QuotationResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.commercial.quotation(id);
  }
  @Post()
  @RequirePermission('quotations:create')
  @ApiCreatedResponse({ type: QuotationResponseDto })
  @ApiOperation({
    summary: 'Crear cotización e ítems con importes calculados por el servidor',
  })
  create(@Body() dto: CreateQuotationDto, @CurrentAuth() auth: RequestAuth) {
    return this.commercial.createQuotation(dto, auth.user.id);
  }
  @Put(':id')
  @RequirePermission('quotations:edit')
  @ApiOkResponse({ type: QuotationResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuotationDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.commercial.updateQuotation(id, dto, auth.user.id);
  }
  @Patch(':id/decision')
  @RequirePermission('quotations:approve')
  @ApiOkResponse({ type: QuotationResponseDto })
  @ApiOperation({
    summary:
      'Registrar aceptación o rechazo comercial del cliente con actor y fecha del servidor',
  })
  decide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: QuotationDecisionDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.commercial.decide(id, dto, auth.user.id);
  }
}
