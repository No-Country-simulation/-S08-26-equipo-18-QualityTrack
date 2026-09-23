import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { Session } from "./Session";

@Entity()
export class RefreshToken {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Session, { index: true })
    session: Session;

    // Solo se guarda el hash SHA-256: una copia de la base no permite renovar sesiones.
    @Unique()
    @Property({ type: "varchar", length: 64 })
    tokenHash: string;

    @Property({ type: "timestamptz" })
    createdAt: Date = new Date();

    // Un token reemplazado que vuelve a usarse indica que la sesión fue copiada.
    @Property({ type: "timestamptz", nullable: true })
    replacedAt?: Date;
}
