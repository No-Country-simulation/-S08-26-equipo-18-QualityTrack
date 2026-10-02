import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { EntityManager } from "@mikro-orm/postgresql";
import { Session } from "../entities/Session";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { AccessTokenPayload } from "./tokens";
import { AuthenticatedRequest } from "./current-auth.decorator";
import { hasPermission, type Permission } from "./permissions";
import { REQUIRED_PERMISSION } from "./require-permission.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly em: EntityManager,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = extractBearerToken(request.headers.authorization);
        if (!token) {
            throw new UnauthorizedException();
        }

        let payload: AccessTokenPayload;
        try {
            payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
        } catch {
            throw new UnauthorizedException();
        }

        // Una firma válida no alcanza: la sesión puede haberse cerrado
        // o revocado antes de que el token expire.
        const session = await this.em.findOne(
            Session,
            { id: payload.sid, revokedAt: null, expiresAt: { $gt: new Date() } },
            { populate: ["user.role"] },
        );
        if (!session || !session.user.isActive || String(session.user.id) !== payload.sub) {
            throw new UnauthorizedException();
        }

        request.auth = { user: session.user, session };
        const permission = this.reflector.getAllAndOverride<Permission>(REQUIRED_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (permission && !hasPermission(session.user.role.name, permission)) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción.');
        }
        return true;
    }
}

function extractBearerToken(header: string | string[] | undefined): string | undefined {
    if (typeof header !== "string") {
        return undefined;
    }
    const [scheme, token] = header.split(" ");
    return scheme === "Bearer" && token ? token : undefined;
}
