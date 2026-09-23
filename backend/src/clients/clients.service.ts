import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager, FilterQuery } from "@mikro-orm/postgresql";
import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { Client } from "../entities/Client";
import { onlyDigits } from "./cuit";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientPageResponseDto, ClientResponseDto, toClientResponse } from "./dto/client-response.dto";
import { ClientStatusFilter, ListClientsQueryDto } from "./dto/list-clients-query.dto";

const TAX_ID_TAKEN_MESSAGE = "Ya existe un cliente con ese CUIT.";

@Injectable()
export class ClientsService {
    constructor(private readonly em: EntityManager) {}

    async list(query: ListClientsQueryDto): Promise<ClientPageResponseDto> {
        const where: FilterQuery<Client> = {};

        if (query.status !== ClientStatusFilter.All) {
            where.isActive = query.status === ClientStatusFilter.Active;
        }

        const search = query.search?.trim();
        if (search) {
            const searchDigits = onlyDigits(search);
            const matches: FilterQuery<Client>[] = [{ businessName: { $ilike: `%${search}%` } }];
            // Sin dígitos no se compara contra el CUIT: un patrón vacío daría todos.
            if (searchDigits) {
                matches.push({ taxId: { $like: `%${searchDigits}%` } });
            }
            where.$or = matches;
        }

        const [clients, total] = await this.em.findAndCount(Client, where, {
            // El id desempata: sin él, dos razones sociales iguales pueden cambiar de
            // página entre una consulta y la siguiente.
            orderBy: { businessName: "asc", id: "asc" },
            limit: query.limit,
            offset: (query.page - 1) * query.limit,
        });

        return {
            items: clients.map(toClientResponse),
            total,
            page: query.page,
            limit: query.limit,
        };
    }

    async getById(id: number): Promise<ClientResponseDto> {
        return toClientResponse(await this.findOrFail(id));
    }

    async create(dto: CreateClientDto): Promise<ClientResponseDto> {
        const taxId = onlyDigits(dto.taxId);
        await this.assertTaxIdIsFree(taxId);

        const client = new Client();
        this.em.assign(client, { ...dto, taxId });

        await this.persist(client);
        return toClientResponse(client);
    }

    async update(id: number, dto: UpdateClientDto): Promise<ClientResponseDto> {
        const client = await this.findOrFail(id);

        if (dto.taxId !== undefined) {
            const taxId = onlyDigits(dto.taxId);
            await this.assertTaxIdIsFree(taxId, id);
        }

        this.em.assign(client, dto);

        await this.persist(client);
        return toClientResponse(client);
    }

    // Repetir la operación deja el mismo estado y no falla: la pantalla puede
    // reintentar sin consecuencia.
    async setStatus(id: number, isActive: boolean): Promise<ClientResponseDto> {
        const client = await this.findOrFail(id);
        client.isActive = isActive;
        await this.em.flush();
        return toClientResponse(client);
    }

    private async findOrFail(id: number): Promise<Client> {
        const client = await this.em.findOne(Client, { id });
        if (!client) {
            throw new NotFoundException("El cliente no existe.");
        }
        return client;
    }

    // Comprobación previa: existe para dar un aviso entendible. Lo que garantiza que
    // no haya dos clientes con el mismo CUIT es el índice único, y por eso el alta
    // vuelve a contemplarlo al guardar.
    private async assertTaxIdIsFree(taxId: string, exceptId?: number): Promise<void> {
        const existing = await this.em.findOne(Client, { taxId });
        if (existing && existing.id !== exceptId) {
            throw new ConflictException(TAX_ID_TAKEN_MESSAGE);
        }
    }

    private async persist(client: Client): Promise<void> {
        try {
            await this.em.persist(client).flush();
        } catch (error) {
            if (error instanceof UniqueConstraintViolationException) {
                throw new ConflictException(TAX_ID_TAKEN_MESSAGE);
            }
            throw error;
        }
    }
}
