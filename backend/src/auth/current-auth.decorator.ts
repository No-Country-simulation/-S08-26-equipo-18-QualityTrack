import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Session } from "../entities/Session";
import { User } from "../entities/User";

export interface RequestAuth {
    user: User;
    session: Session;
}

export interface AuthenticatedRequest {
    headers: Record<string, string | string[] | undefined>;
    auth?: RequestAuth;
}

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext): RequestAuth => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.auth as RequestAuth;
});
