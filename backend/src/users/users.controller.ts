import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAuth } from '../auth/current-auth.decorator';
import type { RequestAuth } from '../auth/current-auth.decorator';
import { RequirePermission } from '../auth/require-permission.decorator';
import { ChangeUserRoleDto, CreateUserDto } from './dto/user-input.dto';
import { UsersService } from './users.service';
import { RoleResponseDto, UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@ApiForbiddenResponse({
  description: 'Solo Administrador puede administrar usuarios.',
})
@ApiBadRequestResponse({ description: 'Datos inválidos o rol inexistente.' })
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('users:view')
  @ApiOperation({ summary: 'Listar usuarios sin credenciales' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  list() {
    return this.users.list();
  }

  @Post()
  @RequirePermission('users:manage')
  @ApiOperation({ summary: 'Crear un usuario con un rol existente' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email.' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id/role')
  @RequirePermission('users:manage')
  @ApiOperation({
    summary:
      'Cambiar el rol sin permitir autodegradación ni perder el último Administrador',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'El usuario no existe.' })
  @ApiConflictResponse({
    description:
      'No se permite autodegradación ni perder el último Administrador.',
  })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserRoleDto,
    @CurrentAuth() auth: RequestAuth,
  ) {
    return this.users.changeRole(id, dto.roleId, auth.user.id);
  }
}

@ApiTags('roles')
@ApiBearerAuth('access-token')
@RequirePermission('users:view')
@Controller('roles')
export class RolesController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar los roles existentes' })
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  list() {
    return this.users.roles();
  }
}
