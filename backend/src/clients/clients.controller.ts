import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import { ClientsService } from "./clients.service";
import { ClientPageResponseDto, ClientResponseDto } from "./dto/client-response.dto";
import { ClientStatusDto } from "./dto/client-status.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { ListClientsQueryDto } from "./dto/list-clients-query.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@ApiTags("clients")
@ApiBearerAuth("access-token")
@Controller("clients")
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) {}

    @Get()
    @ApiOperation({ summary: "Listar clientes por páginas, con búsqueda y filtro de estado" })
    @ApiOkResponse({ type: ClientPageResponseDto })
    list(@Query() query: ListClientsQueryDto) {
        return this.clientsService.list(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Ver la ficha de un cliente" })
    @ApiOkResponse({ type: ClientResponseDto })
    @ApiNotFoundResponse({ description: "El cliente no existe." })
    getById(@Param("id", ParseIntPipe) id: number) {
        return this.clientsService.getById(id);
    }

    @Post()
    @ApiOperation({ summary: "Dar de alta un cliente" })
    @ApiCreatedResponse({ type: ClientResponseDto })
    @ApiConflictResponse({ description: "Ya existe un cliente con ese CUIT." })
    create(@Body() dto: CreateClientDto) {
        return this.clientsService.create(dto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Modificar la ficha de un cliente" })
    @ApiOkResponse({ type: ClientResponseDto })
    @ApiNotFoundResponse({ description: "El cliente no existe." })
    @ApiConflictResponse({ description: "Ya existe un cliente con ese CUIT." })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
        return this.clientsService.update(id, dto);
    }

    // No hay borrado: los clientes se desactivan para no perder su historial.
    @Patch(":id/status")
    @ApiOperation({ summary: "Desactivar o reactivar un cliente" })
    @ApiOkResponse({ type: ClientResponseDto })
    @ApiNotFoundResponse({ description: "El cliente no existe." })
    setStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: ClientStatusDto) {
        return this.clientsService.setStatus(id, dto.isActive);
    }
}
