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
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CurrentAuth } from '../auth/current-auth.decorator';
import type { RequestAuth } from '../auth/current-auth.decorator';
import { QualityDeliveriesService } from './quality-deliveries.service';
import {
  CreateQualityDto,
  UpdateQualityDto,
  CreateDeliveryDto,
  UpdateDeliveryDto,
} from './quality-deliveries.dto';
import {
  QualityResponseDto,
  DeliveryResponseDto,
} from './quality-deliveries-response.dto';
import { WorkOrderResponseDto } from '../work-orders/work-order-response.dto';
@ApiTags('quality')
@ApiBearerAuth('access-token')
@Controller('quality')
export class QualityController {
  constructor(private readonly service: QualityDeliveriesService) {}
  @Get()
  @RequirePermission('quality:view')
  @ApiOkResponse({ type: QualityResponseDto, isArray: true })
  list() {
    return this.service.quality();
  }
  @Get('work-order/:id')
  @RequirePermission('quality:view')
  @ApiOkResponse({ type: QualityResponseDto, isArray: true })
  forOrder(@Param('id', ParseIntPipe) id: number) {
    return this.service.quality(id);
  }
  @Get(':id')
  @RequirePermission('quality:view')
  @ApiOkResponse({ type: QualityResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.control(id);
  }
  @Post()
  @RequirePermission('quality:inspect')
  @ApiCreatedResponse({ type: QualityResponseDto })
  create(@Body() dto: CreateQualityDto, @CurrentAuth() auth: RequestAuth) {
    return this.service.createQuality(dto, auth.user.id);
  }
  @Put(':id')
  @RequirePermission('quality:inspect')
  @ApiOkResponse({ type: QualityResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQualityDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.updateQuality(id, dto, auth.user.id);
  }
}
@ApiTags('deliveries')
@ApiBearerAuth('access-token')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: QualityDeliveriesService) {}
  @Get()
  @RequirePermission('deliveries:view')
  @ApiOkResponse({ type: DeliveryResponseDto, isArray: true })
  list() {
    return this.service.deliveries();
  }
  @Get('work-orders')
  @RequirePermission('deliveries:view')
  @ApiOkResponse({ type: WorkOrderResponseDto, isArray: true })
  orders() {
    return this.service.deliveryOrders();
  }
  @Get('work-order/:id')
  @RequirePermission('deliveries:view')
  @ApiOkResponse({ type: DeliveryResponseDto, isArray: true })
  forOrder(@Param('id', ParseIntPipe) id: number) {
    return this.service.deliveries(id);
  }
  @Get(':id')
  @RequirePermission('deliveries:view')
  @ApiOkResponse({ type: DeliveryResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.delivery(id);
  }
  @Post()
  @RequirePermission('deliveries:create')
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  create(@Body() dto: CreateDeliveryDto, @CurrentAuth() auth: RequestAuth) {
    return this.service.createDelivery(dto, auth.user.id);
  }
  @Put(':id')
  @RequirePermission('deliveries:edit')
  @ApiOkResponse({ type: DeliveryResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.service.updateDelivery(id, dto, auth.user.id);
  }
}
