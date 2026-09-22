import { User } from "../entities/User";

export interface AuthUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: { id: number; name: string; description: string };
}

// Nunca se devuelve la entidad: llevaría el hash de la contraseña en la respuesta.
export function toAuthUser(user: User): AuthUser {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
        },
    };
}
