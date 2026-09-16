import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { WorkOrder } from "./WorkOrder";
import { User } from "./User";

@Entity()
export class RouteSheet extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder)
    workOrder: WorkOrder;

    @Unique()
    @Property({ type: "varchar", length: 100 })
    routeNumber: string;

    // TODO revisar: definir el ciclo de vida de la hoja de ruta mediante un enum.
    // Los estados deben representar las etapas por las que pasa una hoja de ruta
    // desde su creación hasta su cierre o cancelación.
    // @Property({ type: "varchar" })
    // status: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    instructions?: string;

    @ManyToOne(() => User)
    createdBy: User;
}
