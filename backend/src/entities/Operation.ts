import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { RouteSheet } from "./RouteSheet";
import { User } from "./User";

@Entity()
@Unique({properties:['routeSheet', 'operationNumber']})
export class Operation {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => RouteSheet, { index: true })
    routeSheet: RouteSheet;

    @Property({ type: "varchar", length: 100 })
    operationNumber: string;

    @Property({ type: "varchar", length: 500 })
    name: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    description?: string | null;

    @Property({ type: "varchar", length: 500, nullable: true })
    machine?: string | null;

    // TODO revisar: definir el ciclo de vida de la operación mediante un enum.
    // Los estados deben representar las etapas por las que pasa una operación
    // desde su planificación hasta su finalización o cancelación.
    // @Property({ type: "varchar" })
    // status: string;

    @Property({ type: "timestamptz", nullable: true })
    plannedStart?: Date | null;

    @Property({ type: "timestamptz", nullable: true })
    plannedEnd?: Date | null;

    @Property({ type: "timestamptz", nullable: true })
    actualStart?: Date | null;

    @Property({ type: "timestamptz", nullable: true })
    actualEnd?: Date | null;

    @Property({ type: "varchar", length: 5000, nullable: true })
    notes?: string | null;

    @ManyToOne(() => User, {nullable:true, index:true, deleteRule:'no action'})
    createdBy?: User | null;

    @ManyToOne(() => User, {nullable:true, index:true, deleteRule:'no action'})
    executedBy?: User | null;
}
