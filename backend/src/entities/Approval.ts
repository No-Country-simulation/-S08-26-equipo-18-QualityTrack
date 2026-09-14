import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Quotation } from "./Quotation";
import { User } from "./User";

@Entity()
export class Approval {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Quotation)
    quotation: Quotation;

    @ManyToOne(() => User)
    approvedBy: User;

    // TODO revisar: status (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // status: string;

    @Property({ type: "timestamptz", nullable: true })
    approvedAt?: Date;

    @Property({ type: "varchar", length: 5000, nullable: true })
    comments?: string;
}
