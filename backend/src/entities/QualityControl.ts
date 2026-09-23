import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { Operation } from "./Operation";
import { User } from "./User";

@Entity()
export class QualityControl {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder, { index: true })
    workOrder: WorkOrder;

    @ManyToOne(() => Operation, { nullable: true, index: true })
    operation?: Operation;

    // TODO revisar: control_type (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // controlType: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    specification?: string;

    @Property({ type: "decimal", precision: 14, scale: 4, nullable: true })
    measuredValue?: string;

    @Property({ type: "decimal", precision: 14, scale: 4, nullable: true })
    expectedValue?: string;

    @Property({ type: "varchar", length: 20, nullable: true })
    unit?: string;

    // TODO revisar: result (posible enum: pass/fail/..., sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // result: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    observations?: string;

    @ManyToOne(() => User, { index: true })
    performedBy: User;

    @Property({ type: "timestamptz", nullable: true })
    performedAt?: Date;
}
