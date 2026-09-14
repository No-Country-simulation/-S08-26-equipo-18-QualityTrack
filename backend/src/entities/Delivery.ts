import { OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Client } from "./Client";

export class Delivery extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({ type: "integer" })
    clientId: Client["id"]
    @OneToMany(() => Client, (client) => client.id)
    client?: Client;

    @Property({type: "integer"})
    workOrderId: number;

    @Property({ type: "timestampz" })
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