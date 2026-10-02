import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/current-auth.decorator';
import { hasPermission, type Permission } from '../auth/permissions';
@Injectable()
export class DocumentAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & { method: string }>();
    const permissions: Permission[] =
      request.method === 'POST'
        ? ['workOrders:edit', 'requests:edit', 'quotations:edit']
        : ['workOrders:view', 'requests:view', 'quotations:view'];
    if (
      !request.auth ||
      !permissions.some((p) => hasPermission(request.auth!.user.role.name, p))
    )
      throw new ForbiddenException('El rol no permite esta acción documental.');
    return true;
  }
}
