import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Client } from "./Client";
import { User } from "./User";

@Entity()
export class Request extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Client)
    client: Client;

    @Unique()
    @Property({ type: "varchar", length: 100 })
    requestNumber: string;

    @Property({ type: "varchar", length: 500 })
    title: string;

    @Property({ type: "varchar", length: 5000 })
    description: string;

    @Property({ type: "timestamptz" })
    receivedAt: Date;

    @Property({ type: "timestamptz", nullable: true })
    requestedDeliveryDate?: Date;

    // TODO revisar: status (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // status: string;

    @ManyToOne(() => User)
    createdBy: User;
}
