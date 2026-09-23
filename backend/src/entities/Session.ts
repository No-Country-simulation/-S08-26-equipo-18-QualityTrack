import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";
import { User } from "./User";

// Una sesión por inicio de sesión: cada dispositivo tiene la suya
// y puede cerrarse sin afectar a las demás del mismo usuario.
@Entity()
export class Session {
    @PrimaryKey({ type: "uuid" })
    id: string = randomUUID();

    @ManyToOne(() => User, { index: true })
    user: User;

    @Property({ type: "boolean" })
    rememberMe: boolean;

    @Property({ type: "timestamptz" })
    createdAt: Date = new Date();

    // Se usa para vencer la sesión por inactividad aunque expiresAt siga vigente.
    @Property({ type: "timestamptz" })
    lastUsedAt: Date = new Date();

    @Property({ type: "timestamptz" })
    expiresAt: Date;

    // Una sesión revocada no vuelve a ser válida; para seguir hay que iniciar sesión otra vez.
    @Property({ type: "timestamptz", nullable: true })
    revokedAt?: Date;
}
