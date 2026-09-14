import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Client } from "./Client";
import { Request } from "./Request";
import { User } from "./User";

@Entity()
export class Quotation extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Client)
    client: Client;

    @ManyToOne(() => Request)
    request: Request;

    @Unique()
    @Property({ type: "varchar", length: 100 })
    quotationNumber: string;

    @Property({ type: "integer", default: 1 })
    version: number;

    @Property({ type: "varchar", length: 5000 })
    description: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    subtotal: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    taxAmount: string;

    // TODO revisar: currency (posible enum de monedas ISO, sin definir en el diagrama)
    @Property({ type: "varchar", length: 3 })
    currency: string;

    @Property({ type: "timestamptz", nullable: true })
    validUntil?: Date;

    // TODO revisar: status (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // status: string;

    @ManyToOne(() => User)
    createdBy: User;
}
