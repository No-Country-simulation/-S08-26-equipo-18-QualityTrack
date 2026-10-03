import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { WorkOrderStatus } from "./WorkOrderStatus";
import { WorkOrderPriority } from "./WorkOrderPriority";
import { User } from "./User";
import { Quotation } from "./Quotation";

@Entity()
export class WorkOrder extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Unique()
    @Property({type: "integer", defaultRaw: "nextval('work_order_number_seq'::regclass)"})
    workOrderNumber: number;

    // Nullable solo para conservar OT históricas cuyo origen no está documentado.
    @ManyToOne(() => Quotation, { nullable: true, index: true, deleteRule: 'restrict', updateRule: 'cascade' })
    quotation?: Quotation | null;

    @Property({type: "varchar", length: 500})
    title: string;

    @Property({type: "varchar", length: 5000})
    description: string;

    // Se incorporó un enum para establecer niveles de prioridad
    // definidos y evitar valores inconsistentes.
    @Enum(() => WorkOrderPriority)
    priority: WorkOrderPriority;

    // Se reemplazó el estado libre por un enum para controlar los estados
    // válidos de una Orden de Trabajo y evitar valores arbitrarios.
    @Enum(() => WorkOrderStatus)
    status: WorkOrderStatus;

    // Se reemplazó el campo integer por una relación con User,
    // ya que createdBy identifica al usuario que creó la Orden de Trabajo.
    @ManyToOne(() => User, { index: true })
    createdBy: User;

    @Property({type: "timestamptz"})
    plannedStartDate: Date;

    @Property({type: "timestamptz"})
    plannedEndDate: Date;

    // Estas fechas son nullable porque al crear una OT todavía puede
    // no haber comenzado ni finalizado.
    @Property({type: "timestamptz", nullable: true})
    actualStartDate?: Date | null;

    @Property({type: "timestamptz", nullable: true})
    actualEndDate?: Date | null;
}
