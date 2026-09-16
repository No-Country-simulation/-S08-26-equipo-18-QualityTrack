import { Property } from "@mikro-orm/decorators/legacy";

export abstract class BaseEntity {
    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    // Se eliminó nullable porque todas las entidades deben tener
    // una fecha de última modificación desde su creación.
    // MikroORM actualizará este valor automáticamente cuando cambie la entidad.
    @Property({ onUpdate: () => new Date(), nullable: true })
    updatedAt: Date = new Date();
}