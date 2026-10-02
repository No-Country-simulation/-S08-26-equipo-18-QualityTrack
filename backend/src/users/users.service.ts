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
import { toAuthUser } from '../auth/auth-user';
import { PASSWORD_HASH_ROUNDS } from '../auth/password';
import { hasPermission } from '../auth/permissions';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { CreateUserDto } from './dto/user-input.dto';

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
    return users.map(toAuthUser);
  }

  async roles() {
    const roles = await this.em.find(Role, {}, { orderBy: { name: 'asc' } });
    return roles.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }

  async create(dto: CreateUserDto) {
    const role = await this.findRole(this.em, dto.roleId);
    if (await this.em.findOne(User, { email: dto.email })) {
      throw new ConflictException('Ya existe un usuario con ese email.');
    }
    const user = new User();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.email = dto.email;
    user.role = role;
    user.password = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    try {
      await this.em.persist(user).flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }
      throw error;
    }
    return toAuthUser(user);
  }

  async changeRole(id: number, roleId: number, actorId: number) {
    if (id < 1 || id > 2147483647)
      throw new BadRequestException('El ID del usuario es inválido.');
    // Serialize role changes on the existing administrator role. This also
    // protects against two administrators demoting each other simultaneously.
    // A clear transaction context avoids reusing entities loaded by the guard.
    return this.em.transactional(
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
        if (!actor || !hasPermission(actor.role.name, 'users:manage')) {
          throw new ForbiddenException(
            'El rol actual no permite administrar usuarios.',
          );
        }
        const user = await em.findOne(User, { id }, { populate: ['role'] });
        if (!user) throw new NotFoundException('El usuario no existe.');
        const role = await this.findRole(em, roleId);
        if (user.role.id === role.id) return toAuthUser(user);
        if (id === actorId && !hasPermission(role.name, 'users:manage')) {
          throw new ConflictException(
            'No podés quitarte el rol Administrador.',
          );
        }
        if (
          user.role.id === adminRole.id &&
          !hasPermission(role.name, 'users:manage') &&
          (await em.count(User, { role: adminRole.id })) <= 1
        ) {
          throw new ConflictException('Debe quedar al menos un Administrador.');
        }
        user.role = role;
        await em.flush();
        return toAuthUser(user);
      },
      { clear: true },
    );
  }

  private async findRole(em: EntityManager, id: number) {
    const role = await em.findOne(Role, { id });
    if (!role) throw new BadRequestException('El rol indicado no existe.');
    return role;
  }
}
