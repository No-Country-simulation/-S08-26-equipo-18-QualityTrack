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

    // TODO revisar: definir el rol del usuario dentro de la WorkOrder.
    // Este rol es independiente del Role general del sistema.
    // Los valores y si corresponde utilizar un enum deben definirse
    // según el modelo funcional de la OT.
    // @Property({ type: "varchar" })
    // role: string;

    @Property({ type: "timestamptz", onCreate: () => new Date() })
    assignedAt: Date = new Date();
}
