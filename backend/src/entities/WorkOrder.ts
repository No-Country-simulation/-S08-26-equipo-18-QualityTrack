import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { WorkOrderStatus } from "./WorkOrderStatus";
import { WorkOrderPriority } from "./WorkOrderPriority";
import { User } from "./User";

@Entity()
export class WorkOrder extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({type: "integer"})
    workOrderNumber: number;

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
    actualStartDate?: Date;

    @Property({type: "timestamptz", nullable: true})
    actualEndDate?: Date;
}