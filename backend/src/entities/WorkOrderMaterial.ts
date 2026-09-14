import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { Material } from "./Material";

@Entity()
export class WorkOrderMaterial {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder)
    workOrder: WorkOrder;

    @ManyToOne(() => Material)
    material: Material;

    @Property({ type: "varchar", length: 100, nullable: true })
    lotNumber?: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    quantity: string;

    // TODO revisar: unit (posible enum de unidades de medida, sin definir en el diagrama)
    @Property({ type: "varchar", length: 20, nullable: true })
    unit?: string;

    @Property({ type: "varchar", length: 100, nullable: true })
    certificateNumber?: string;

    @Property({ type: "timestamptz", nullable: true })
    receivedAt?: Date;

    @Property({ type: "varchar", length: 5000, nullable: true })
    notes?: string;
}
