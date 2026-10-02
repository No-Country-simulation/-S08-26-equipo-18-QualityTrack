// Política de las acciones implementadas. Se amplía junto con cada API nueva.
export type Permission = 'clients:view' | 'clients:create' | 'clients:edit' | 'clients:delete';

const CLIENT_PERMISSIONS: ReadonlyMap<string, readonly Permission[]> = new Map([
    ['administrador', ['clients:view', 'clients:create', 'clients:edit', 'clients:delete']],
    ['supervisor', ['clients:view', 'clients:create', 'clients:edit']],
    ['administracion', ['clients:view', 'clients:create', 'clients:edit']],
]);

export function hasPermission(roleName: string, permission: Permission): boolean {
    const role = roleName.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
    return CLIENT_PERMISSIONS.get(role)?.includes(permission) ?? false;
}
