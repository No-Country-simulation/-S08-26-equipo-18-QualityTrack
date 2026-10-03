import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { compare, hashSync } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { RefreshToken } from '../entities/RefreshToken';
import { Session } from '../entities/Session';
import { User } from '../entities/User';
import { AuthUser, toAuthUser } from './auth-user';
import { LoginDto } from './dto/login.dto';
import { PASSWORD_HASH_ROUNDS } from './password';
import {
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  INVALID_CREDENTIALS_MESSAGE,
  REFRESH_REUSE_GRACE_MS,
  SESSION_INACTIVITY_LIMIT_MS,
  SESSION_WITH_REMEMBER_MS,
  SESSION_WITHOUT_REMEMBER_MS,
} from './session-policy';
import {
  AccessTokenPayload,
  generateRefreshToken,
  hashRefreshToken,
} from './tokens';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends TokenPair {
  user: AuthUser;
}

@Injectable()
export class AuthService {
  // Cuando el correo no existe se compara contra este hash, para que la respuesta
  // tarde lo mismo y no delate qué correos están registrados.
  private readonly unknownUserHash = hashSync(
    randomBytes(16).toString('hex'),
    PASSWORD_HASH_ROUNDS,
  );

  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.em.findOne(User, { email }, { populate: ['role'] });

    const passwordMatches = await compare(
      dto.password,
      user?.password ?? this.unknownUserHash,
    );
    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.em.transactional(
      async (em) => {
        const currentUser = await em.findOne(
          User,
          { id: user.id, email },
          { lockMode: LockMode.PESSIMISTIC_WRITE },
        );
        if (!currentUser?.isActive || currentUser.password !== user.password) {
          throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }
        await em.populate(currentUser, ['role']);
        const rememberMe = dto.rememberMe ?? false;
        const now = new Date();

        const session = new Session();
        session.user = currentUser;
        session.rememberMe = rememberMe;
        session.createdAt = now;
        session.lastUsedAt = now;
        session.expiresAt = new Date(
          now.getTime() +
            (rememberMe
              ? SESSION_WITH_REMEMBER_MS
              : SESSION_WITHOUT_REMEMBER_MS),
        );

        const refreshToken = generateRefreshToken();
        const storedToken = new RefreshToken();
        storedToken.session = session;
        storedToken.tokenHash = hashRefreshToken(refreshToken);

        // Un solo flush: la sesión y su primer token se guardan en la misma transacción.
        await em.persist([session, storedToken]).flush();

        return {
          user: toAuthUser(currentUser),
          accessToken: await this.signAccessToken(currentUser, session),
          refreshToken,
          expiresIn: this.accessTokenTtlSeconds(),
        };
      },
      { clear: true },
    );
  }

  async refresh(presentedToken: string): Promise<TokenPair> {
    const candidate = await this.em.findOne(
      RefreshToken,
      { tokenHash: hashRefreshToken(presentedToken) },
      { populate: ['session.user'] },
    );
    if (!candidate) throw new UnauthorizedException();
    const result = await this.em.transactional(
      async (em) => {
        const user = await em.findOne(
          User,
          { id: candidate.session.user.id },
          { lockMode: LockMode.PESSIMISTIC_WRITE },
        );
        if (!user?.isActive) throw new UnauthorizedException();
        return this.refreshForUser(em, presentedToken);
      },
      { clear: true },
    );
    // Un replay debe confirmar la revocación antes de lanzar el 401.
    if (!result) throw new UnauthorizedException();
    return result;
  }

  private async refreshForUser(
    em: EntityManager,
    presentedToken: string,
  ): Promise<TokenPair | null> {
    const now = new Date();
    const storedToken = await em.findOne(
      RefreshToken,
      { tokenHash: hashRefreshToken(presentedToken) },
      { populate: ['session.user'] },
    );
    if (!storedToken) {
      throw new UnauthorizedException();
    }

    const session = storedToken.session;

    // Una sesión cerrada no puede renovar tokens ni afectar otras sesiones.
    if (session.revokedAt) {
      throw new UnauthorizedException();
    }

    // Un token ya reemplazado que reaparece fuera del margen solo puede venir
    // de una copia: se cierran todas las sesiones de la persona.
    if (
      storedToken.replacedAt &&
      now.getTime() - storedToken.replacedAt.getTime() > REFRESH_REUSE_GRACE_MS
    ) {
      await this.revokeAllSessions(session.user, now, em);
      return null;
    }

    if (!isSessionUsable(session, now)) {
      throw new UnauthorizedException();
    }

    // Dentro del margen se conserva la fecha del primer reemplazo, para que
    // reintentos sucesivos no extiendan la ventana.
    storedToken.replacedAt ??= now;
    session.lastUsedAt = now;
    if (session.rememberMe) {
      session.expiresAt = new Date(now.getTime() + SESSION_WITH_REMEMBER_MS);
    }

    const refreshToken = generateRefreshToken();
    const nextToken = new RefreshToken();
    nextToken.session = session;
    nextToken.tokenHash = hashRefreshToken(refreshToken);

    // El reemplazo del token anterior y el alta del nuevo van en la misma transacción.
    await em.persist(nextToken).flush();

    return {
      accessToken: await this.signAccessToken(session.user, session),
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds(),
    };
  }

  async logout(session: Session): Promise<void> {
    session.revokedAt ??= new Date();
    await this.em.flush();
  }

  private async revokeAllSessions(
    user: User,
    now: Date,
    em: EntityManager = this.em,
  ): Promise<void> {
    await em.nativeUpdate(
      Session,
      { user, revokedAt: null },
      { revokedAt: now },
    );
  }

  private signAccessToken(user: User, session: Session): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: String(user.id),
      sid: session.id,
    };
    return this.jwtService.signAsync(payload);
  }

  private accessTokenTtlSeconds(): number {
    return (
      Number(this.config.get('JWT_ACCESS_TTL')) ||
      DEFAULT_ACCESS_TOKEN_TTL_SECONDS
    );
  }
}

function isSessionUsable(session: Session, now: Date): boolean {
  return (
    !session.revokedAt &&
    session.expiresAt.getTime() > now.getTime() &&
    now.getTime() - session.lastUsedAt.getTime() <= SESSION_INACTIVITY_LIMIT_MS
  );
}
