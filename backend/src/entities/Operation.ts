import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { RouteSheet } from "./RouteSheet";

@Entity()
export class Operation {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => RouteSheet)
    routeSheet: RouteSheet;

    @Property({ type: "varchar", length: 100 })
    operationNumber: string;

    @Property({ type: "varchar", length: 500 })
    name: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    description?: string;

    @Property({ type: "varchar", length: 500, nullable: true })
    machine?: string;

    // TODO revisar: status (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // status: string;

    @Property({ type: "timestamptz", nullable: true })
    plannedStart?: Date;

    @Property({ type: "timestamptz", nullable: true })
    plannedEnd?: Date;

    @Property({ type: "timestamptz", nullable: true })
    actualStart?: Date;

    @Property({ type: "timestamptz", nullable: true })
    actualEnd?: Date;

    @Property({ type: "varchar", length: 5000, nullable: true })
    notes?: string;
}
