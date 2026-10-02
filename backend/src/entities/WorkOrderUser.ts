import { Entity, ManyToOne, PrimaryKey, Property, Index } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { User } from "./User";

@Entity()
@Index({name:'work_order_user_active_unique', expression:'create unique index "work_order_user_active_unique" on "work_order_user" ("work_order_id", "user_id") where "unassigned_at" is null'})
export class WorkOrderUser {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder, { index: true })
    workOrder: WorkOrder;

    @ManyToOne(() => User, { index: true })
    user: User;

    // TODO revisar: definir el rol del usuario dentro de la WorkOrder.
    // Este rol es independiente del Role general del sistema.
    // Los valores y si corresponde utilizar un enum deben definirse
    // según el modelo funcional de la OT.
    // @Property({ type: "varchar" })
    // role: string;

    @Property({ type: "timestamptz", onCreate: () => new Date() })
    assignedAt: Date = new Date();

    @ManyToOne(() => User, {nullable:true, index:true, deleteRule:'no action'})
    assignedBy?: User | null;

    @Property({type:'timestamptz',nullable:true})
    unassignedAt?: Date | null;

    @ManyToOne(() => User, {nullable:true,index:true,deleteRule:'no action'})
    unassignedBy?: User | null;
}
