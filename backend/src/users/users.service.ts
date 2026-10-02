import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { hash } from 'bcryptjs';
import { PASSWORD_HASH_ROUNDS } from '../auth/password';
import { hasPermission } from '../auth/permissions';
import { Role } from '../entities/Role';
import { Session } from '../entities/Session';
import { User } from '../entities/User';
import { CreateUserDto, UpdateUserDto } from './dto/user-input.dto';
import { toUserResponse } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async list() {
    const users = await this.em.find(
      User,
      {},
      {
        populate: ['role'],
        orderBy: { lastName: 'asc', firstName: 'asc', id: 'asc' },
      },
    );
    return users.map(toUserResponse);
  }

  async roles() {
    const roles = await this.em.find(Role, {}, { orderBy: { name: 'asc' } });
    return roles.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }

  async create(dto: CreateUserDto, actorId: number) {
    const password = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    return this.administration(actorId, async (em) => {
      const user = new User();
      user.firstName = dto.firstName;
      user.lastName = dto.lastName;
      user.email = dto.email;
      user.dni = dto.dni;
      user.role = await this.findRole(em, dto.roleId);
      user.password = password;
      await em.persist(user).flush();
      return toUserResponse(user);
    });
  }

  async update(id: number, dto: UpdateUserDto, actorId: number) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('Indicá al menos un dato para editar.');
    return this.administration(actorId, async (em) => {
      const user = await this.findUser(em, id);
      for (const field of ['firstName', 'lastName', 'email', 'dni'] as const) {
        if (dto[field] !== undefined) user[field] = dto[field];
      }
      if (!user.dni) {
        throw new BadRequestException('Completá el DNI para editar esta cuenta.');
      }
      await em.flush();
      return toUserResponse(user);
    });
  }

  async changeRole(id: number, roleId: number, actorId: number) {
    return this.administration(actorId, async (em, adminRole) => {
      const user = await this.findUser(em, id);
      const role = await this.findRole(em, roleId);
      if (user.role.id === role.id) return toUserResponse(user);
      if (id === actorId && !hasPermission(role.name, 'users:manage')) {
        throw new ConflictException('No podés quitarte el rol Administrador.');
      }
      if (
        user.isActive &&
        user.role.id === adminRole.id &&
        !hasPermission(role.name, 'users:manage')
      ) {
        await this.assertAnotherAdministrator(em, adminRole);
      }
      user.role = role;
      await em.flush();
      return toUserResponse(user);
    });
  }

  async setStatus(id: number, isActive: boolean, actorId: number) {
    return this.administration(actorId, async (em, adminRole) => {
      const user = await this.findUser(em, id);
      if (!isActive && id === actorId)
        throw new ConflictException('No podés desactivar tu propia cuenta.');
      if (user.isActive && !isActive && user.role.id === adminRole.id) {
        await this.assertAnotherAdministrator(em, adminRole);
      }
      user.isActive = isActive;
      if (!isActive) {
        // El estado y la revocación se confirman juntos. Reactivar no revive sesiones.
        await em.nativeUpdate(
          Session,
          { user: id, revokedAt: null },
          { revokedAt: new Date() },
        );
      }
      await em.flush();
      return toUserResponse(user);
    });
  }

  private async administration<T>(
    actorId: number,
    action: (em: EntityManager, adminRole: Role) => Promise<T>,
  ): Promise<T> {
    try {
      // Este bloqueo serializa cambios de rol y estado sobre administradores activos.
      return await this.em.transactional(
        async (em) => {
          const adminRole = await em.findOneOrFail(
            Role,
            { name: 'Administrador' },
            { lockMode: LockMode.PESSIMISTIC_WRITE },
          );
          const actor = await em.findOne(
            User,
            { id: actorId },
            { populate: ['role'] },
          );
          if (
            !actor?.isActive ||
            !hasPermission(actor.role.name, 'users:manage')
          ) {
            throw new ForbiddenException(
              'El rol actual no permite administrar usuarios.',
            );
          }
          return action(em, adminRole);
        },
        { clear: true },
      );
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Ya existe un usuario con ese email o DNI.',
        );
      }
      throw error;
    }
  }

  private async findUser(em: EntityManager, id: number) {
    if (id < 1 || id > 2147483647)
      throw new BadRequestException('El ID del usuario es inválido.');
    // Login/refresh toman el mismo bloqueo para no abrir sesiones después de la baja.
    const user = await em.findOne(
      User,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
    if (!user) throw new NotFoundException('El usuario no existe.');
    await em.populate(user, ['role']);
    return user;
  }

  private async findRole(em: EntityManager, id: number) {
    const role = await em.findOne(Role, { id });
    if (!role) throw new BadRequestException('El rol indicado no existe.');
    return role;
  }

  private async assertAnotherAdministrator(em: EntityManager, role: Role) {
    if ((await em.count(User, { role: role.id, isActive: true })) <= 1) {
      throw new ConflictException(
        'Debe quedar al menos un Administrador activo.',
      );
    }
  }
}
