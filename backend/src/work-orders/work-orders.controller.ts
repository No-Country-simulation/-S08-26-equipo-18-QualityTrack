import {
  WorkOrderResponseDto,
  ApprovalResponseDto,
} from './work-order-response.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CurrentAuth } from '../auth/current-auth.decorator';
import type { RequestAuth } from '../auth/current-auth.decorator';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  CreateApprovalDto,
  DecideApprovalDto,
} from './work-order.dto';
@ApiTags('work-orders')
@ApiBearerAuth('access-token')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}
  @ApiOkResponse({ type: WorkOrderResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.service.list();
  }
  @ApiOkResponse({ type: WorkOrderResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }
  @ApiCreatedResponse({ type: WorkOrderResponseDto })
  @Post()
  @RequirePermission('workOrders:create')
  @ApiOperation({
    summary: 'Crear OT desde cotización aceptada; número generado en BD',
  })
  create(@Body() dto: CreateWorkOrderDto, @CurrentAuth() auth: RequestAuth) {
    return this.service.create(dto, auth.user.id);
  }
  @ApiOkResponse({ type: WorkOrderResponseDto })
  @Put(':id')
  @RequirePermission('workOrders:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.update(id, dto, auth.user.id);
  }
}
@ApiTags('approvals')
@ApiBearerAuth('access-token')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly service: WorkOrdersService) {}
  @ApiOkResponse({ type: ApprovalResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.service.approvals();
  }
  @ApiOkResponse({
    type: ApprovalResponseDto,
    description: 'Aprobación o null para una OT histórica sin registro.',
  })
  @Get('work-order/:id')
  @RequirePermission('workOrders:view')
  byWorkOrder(@Param('id', ParseIntPipe) id: number) {
    return this.service.approvalFor(id);
  }
  @ApiOkResponse({ type: ApprovalResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.approval(id);
  }
  @ApiCreatedResponse({ type: ApprovalResponseDto })
  @Post()
  @RequirePermission('workOrders:approve')
  create(@Body() dto: CreateApprovalDto, @CurrentAuth() auth: RequestAuth) {
    return this.service.decide(dto.workOrderId, dto, auth.user.id, true);
  }
  @ApiOkResponse({ type: ApprovalResponseDto })
  @Put(':id/decide')
  @RequirePermission('workOrders:approve')
  decide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideApprovalDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.decide(id, dto, auth.user.id);
  }
}
