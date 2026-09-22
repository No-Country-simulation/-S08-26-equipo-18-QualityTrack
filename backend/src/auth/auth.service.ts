import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EntityManager } from "@mikro-orm/postgresql";
import { compare, hashSync } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { RefreshToken } from "../entities/RefreshToken";
import { Session } from "../entities/Session";
import { User } from "../entities/User";
import { AuthUser, toAuthUser } from "./auth-user";
import { LoginDto } from "./dto/login.dto";
import { PASSWORD_HASH_ROUNDS } from "./password";
import {
    DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    INVALID_CREDENTIALS_MESSAGE,
    REFRESH_REUSE_GRACE_MS,
    SESSION_INACTIVITY_LIMIT_MS,
    SESSION_WITH_REMEMBER_MS,
    SESSION_WITHOUT_REMEMBER_MS,
} from "./session-policy";
import { AccessTokenPayload, generateRefreshToken, hashRefreshToken } from "./tokens";

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
    private readonly unknownUserHash = hashSync(randomBytes(16).toString("hex"), PASSWORD_HASH_ROUNDS);

    constructor(
        private readonly em: EntityManager,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    async login(dto: LoginDto): Promise<LoginResult> {
        const email = dto.email.trim().toLowerCase();
        const user = await this.em.findOne(User, { email }, { populate: ["role"] });

        const passwordMatches = await compare(dto.password, user?.password ?? this.unknownUserHash);
        if (!user || !passwordMatches) {
            throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }

        const rememberMe = dto.rememberMe ?? false;
        const now = new Date();

        const session = new Session();
        session.user = user;
        session.rememberMe = rememberMe;
        session.createdAt = now;
        session.lastUsedAt = now;
        session.expiresAt = new Date(
            now.getTime() + (rememberMe ? SESSION_WITH_REMEMBER_MS : SESSION_WITHOUT_REMEMBER_MS),
        );

        const refreshToken = generateRefreshToken();
        const storedToken = new RefreshToken();
        storedToken.session = session;
        storedToken.tokenHash = hashRefreshToken(refreshToken);

        // Un solo flush: la sesión y su primer token se guardan en la misma transacción.
        await this.em.persist([session, storedToken]).flush();

        return {
            user: toAuthUser(user),
            accessToken: await this.signAccessToken(user, session),
            refreshToken,
            expiresIn: this.accessTokenTtlSeconds(),
        };
    }

    async refresh(presentedToken: string): Promise<TokenPair> {
        const now = new Date();
        const storedToken = await this.em.findOne(
            RefreshToken,
            { tokenHash: hashRefreshToken(presentedToken) },
            { populate: ["session.user"] },
        );
        if (!storedToken) {
            throw new UnauthorizedException();
        }

        const session = storedToken.session;

        // Un token ya reemplazado que reaparece fuera del margen solo puede venir
        // de una copia: se cierran todas las sesiones de la persona.
        if (storedToken.replacedAt && now.getTime() - storedToken.replacedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
            await this.revokeAllSessions(session.user, now);
            throw new UnauthorizedException();
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
        await this.em.persist(nextToken).flush();

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

    private async revokeAllSessions(user: User, now: Date): Promise<void> {
        await this.em.nativeUpdate(Session, { user, revokedAt: null }, { revokedAt: now });
    }

    private signAccessToken(user: User, session: Session): Promise<string> {
        const payload: AccessTokenPayload = { sub: String(user.id), sid: session.id };
        return this.jwtService.signAsync(payload);
    }

    private accessTokenTtlSeconds(): number {
        return Number(this.config.get("JWT_ACCESS_TTL")) || DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
    }
}

function isSessionUsable(session: Session, now: Date): boolean {
    return (
        !session.revokedAt &&
        session.expiresAt.getTime() > now.getTime() &&
        now.getTime() - session.lastUsedAt.getTime() <= SESSION_INACTIVITY_LIMIT_MS
    );
}
