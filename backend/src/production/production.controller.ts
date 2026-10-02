import {
  MaterialResponseDto,
  RouteSheetResponseDto,
  OperationResponseDto,
  AssignedMaterialResponseDto,
  PersonnelResponseDto,
  ProductionPersonDto,
} from './production-response.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
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
import { ProductionService } from './production.service';
import {
  CreateMaterialDto,
  CreateRouteSheetDto,
  UpdateRouteSheetDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationExecutionDto,
  AssignMaterialDto,
  UpdateAssignedMaterialDto,
  AssignPersonnelDto,
} from './production.dto';

@ApiTags('materials')
@ApiBearerAuth('access-token')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: MaterialResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.s.materials();
  }
  @ApiOkResponse({ type: MaterialResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.s.material(id);
  }
  @ApiCreatedResponse({ type: MaterialResponseDto })
  @Post()
  @RequirePermission('workOrders:plan')
  create(@Body() dto: CreateMaterialDto, @CurrentAuth() auth: RequestAuth) {
    return this.s.createMaterial(dto, auth.user.id);
  }
}
@ApiTags('route-sheets')
@ApiBearerAuth('access-token')
@Controller('route-sheets')
export class RouteSheetsController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: RouteSheetResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.s.sheets();
  }
  @ApiOkResponse({ type: RouteSheetResponseDto, isArray: true })
  @Get('work-order/:id')
  @RequirePermission('workOrders:view')
  forOrder(@Param('id', ParseIntPipe) id: number) {
    return this.s.sheets(id);
  }
  @ApiOkResponse({ type: RouteSheetResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.s.sheet(id);
  }
  @ApiCreatedResponse({ type: RouteSheetResponseDto })
  @Post()
  @RequirePermission('workOrders:plan')
  @ApiOperation({
    summary: 'Crear hoja con número automático y autor de sesión',
  })
  create(@Body() dto: CreateRouteSheetDto, @CurrentAuth() auth: RequestAuth) {
    return this.s.createSheet(dto, auth.user.id);
  }
  @ApiOkResponse({ type: RouteSheetResponseDto })
  @Put(':id')
  @RequirePermission('workOrders:plan')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRouteSheetDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.s.updateSheet(id, dto, auth.user.id);
  }
}
@ApiTags('operations')
@ApiBearerAuth('access-token')
@Controller('operations')
export class OperationsController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: OperationResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.s.operations();
  }
  @ApiOkResponse({ type: OperationResponseDto, isArray: true })
  @Get('route-sheet/:id')
  @RequirePermission('workOrders:view')
  forSheet(@Param('id', ParseIntPipe) id: number) {
    return this.s.operations(id);
  }
  @ApiOkResponse({ type: OperationResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.s.operation(id);
  }
  @ApiCreatedResponse({ type: OperationResponseDto })
  @Post()
  @RequirePermission('workOrders:plan')
  create(@Body() dto: CreateOperationDto, @CurrentAuth() auth: RequestAuth) {
    return this.s.createOperation(dto, auth.user.id);
  }
  @ApiOkResponse({ type: OperationResponseDto })
  @Put(':id')
  @RequirePermission('workOrders:plan')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOperationDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.s.updateOperation(id, dto, auth.user.id);
  }
  @ApiOkResponse({ type: OperationResponseDto })
  @Patch(':id/execution')
  @RequirePermission('workOrders:execute')
  execute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OperationExecutionDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.s.execute(id, dto, auth.user.id);
  }
}
@ApiTags('work-order-materials')
@ApiBearerAuth('access-token')
@Controller('work-order-materials')
export class AssignedMaterialsController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: AssignedMaterialResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.s.assignedMaterials();
  }
  @ApiOkResponse({ type: AssignedMaterialResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.s.assignedMaterial(id);
  }
  @ApiCreatedResponse({ type: AssignedMaterialResponseDto })
  @Post()
  @RequirePermission('workOrders:plan')
  create(@Body() dto: AssignMaterialDto, @CurrentAuth() auth: RequestAuth) {
    return this.s.assignMaterial(dto, auth.user.id);
  }
  @ApiOkResponse({ type: AssignedMaterialResponseDto })
  @Put(':id')
  @RequirePermission('workOrders:plan')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignedMaterialDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.s.updateMaterial(id, dto, auth.user.id);
  }
}
@ApiTags('work-order-users')
@ApiBearerAuth('access-token')
@Controller('work-order-users')
export class PersonnelController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: ProductionPersonDto, isArray: true })
  @Get('available')
  @RequirePermission('workOrders:assign')
  available() {
    return this.s.availablePersonnel();
  }
  @ApiOkResponse({ type: PersonnelResponseDto, isArray: true })
  @Get()
  @RequirePermission('workOrders:view')
  list() {
    return this.s.personnel();
  }
  @ApiOkResponse({ type: PersonnelResponseDto })
  @Get(':id')
  @RequirePermission('workOrders:view')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.s.assignedPerson(id);
  }
  @ApiCreatedResponse({ type: PersonnelResponseDto })
  @Post()
  @RequirePermission('workOrders:assign')
  create(@Body() dto: AssignPersonnelDto, @CurrentAuth() auth: RequestAuth) {
    return this.s.assignPersonnel(dto, auth.user.id);
  }
  @ApiOkResponse({ type: PersonnelResponseDto })
  @Patch(':id/unassign')
  @RequirePermission('workOrders:assign')
  @ApiOperation({ summary: 'Finalizar la asignación sin borrar historial' })
  unassign(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.s.unassign(id, auth.user.id);
  }
}
@ApiTags('work-orders')
@ApiBearerAuth('access-token')
@Controller('work-orders')
export class OrderProductionController {
  constructor(private readonly s: ProductionService) {}
  @ApiOkResponse({ type: AssignedMaterialResponseDto, isArray: true })
  @Get(':id/materials')
  @RequirePermission('workOrders:view')
  materials(@Param('id', ParseIntPipe) id: number) {
    return this.s.assignedMaterials(id);
  }
  @ApiOkResponse({ type: PersonnelResponseDto, isArray: true })
  @Get(':id/users')
  @RequirePermission('workOrders:view')
  personnel(@Param('id', ParseIntPipe) id: number) {
    return this.s.personnel(id);
  }
}
