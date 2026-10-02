import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { Material } from "./Material";
import { User } from "./User";

@Entity()
export class WorkOrderMaterial {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder, { index: true })
    workOrder: WorkOrder;

    @ManyToOne(() => Material, { index: true })
    material: Material;

    @Property({ type: "varchar", length: 100, nullable: true })
    lotNumber?: string | null;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    quantity: string;

    // TODO revisar: definir las unidades de medida mediante un enum.
    // Los valores deben establecerse según las unidades utilizadas
    // para cuantificar materiales en las Órdenes de Trabajo.
    @Property({ type: "varchar", length: 20, nullable: true })
    unit?: string | null;

    @Property({ type: "varchar", length: 100, nullable: true })
    certificateNumber?: string | null;

    @Property({ type: "timestamptz", nullable: true })
    receivedAt?: Date | null;

    @Property({ type: "varchar", length: 5000, nullable: true })
    notes?: string | null;

    @ManyToOne(() => User, {nullable:true, index:true, deleteRule:'no action'})
    assignedBy?: User | null;
}
