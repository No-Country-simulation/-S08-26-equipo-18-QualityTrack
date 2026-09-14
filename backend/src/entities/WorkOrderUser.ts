import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { User } from "./User";

@Entity()
export class WorkOrderUser {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder)
    workOrder: WorkOrder;

    @ManyToOne(() => User)
    user: User;

    // TODO revisar: role (posible enum de rol dentro de la OT, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // role: string;

    @Property({ type: "timestamptz", onCreate: () => new Date() })
    assignedAt: Date = new Date();
}
