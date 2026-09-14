import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { User } from "./User";
import { ApprovalStatus } from "./ApprovalStatus";

@Entity()
export class Approval {
    @PrimaryKey({ type: "integer" })
    id: number;

    // La aprobación pasó a estar asociada a la WorkOrder,
    // ya que representa una decisión interna sobre la ejecución de la OT.
    @ManyToOne(() => WorkOrder)
    workorder: WorkOrder;

    // approvedBy pasó a decidedBy, ya que una decisión puede terminar 
    // tanto en aprobación como en rechazo.
    @ManyToOne(() => User)
    decidedBy: User;

    // Se incorporó un enum ApprovalStatus para limitar los estados 
    // posibles de una aprobación y evitar valores libres.
    @Property({type:"enum", items: () => ApprovalStatus})
    status: ApprovalStatus;

    // approvedAt pasó a decisionAt porque la fecha corresponde 
    // // al momento en que se toma la decisión, independientemente 
    // // de si el resultado es APPROVED o REJECTED.
    @Property({ type: "timestamptz", nullable: true })
    decisionAt?: Date;

    @Property({ type: "varchar", length: 5000, nullable: true })
    comments?: string;
}
