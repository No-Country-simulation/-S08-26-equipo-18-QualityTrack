import { ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Client } from "./Client";
import { WorkOrder } from "./WorkOrder";

export class Delivery extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    // Se reemplazó clientId + OneToMany por ManyToOne,
    // porque cada entrega pertenece a un único cliente,
    // mientras un cliente puede tener múltiples entregas.
    @ManyToOne(() => Client, (client) => client.id)
    client?: Client;

    // Se reemplazó workOrderId por una relación ManyToOne,
    // porque cada entrega corresponde a una WorkOrder,
    // mientras una WorkOrder puede generar múltiples entregas.
    @ManyToOne(() => WorkOrder)
    workOrder: WorkOrder;

    @Property({type: "integer"})
    workOrderId: number;

    @Property({ type: "timestamptz" })
    deliveryDate: Date;

    @Property({ type: "integer" })
    quantity: number;
    /* 
    TODO Definir status
        @Property({type: "timestampz"})
        status: Date;
    */

    @Property({type: "varchar", length: 5000})
    notes: string;


}