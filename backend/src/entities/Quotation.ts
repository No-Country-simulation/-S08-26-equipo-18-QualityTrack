import { Check, Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Client } from "./Client";
import { Request } from "./Request";
import { User } from "./User";

@Entity()
@Check({ name: 'quotation_decision_consistent', expression: "(decision_status = 'pending' and decided_by_id is null and decided_at is null) or (decision_status in ('accepted', 'rejected') and decided_by_id is not null and decided_at is not null)" })
export class Quotation extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Client, { index: true })
    client: Client;

    @ManyToOne(() => Request, { index: true })
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

    // TODO revisar: definir monedas soportadas mediante un enum.
    // Evaluar códigos ISO 4217 (por ejemplo ARS, USD, EUR) según
    // las necesidades comerciales de QualityTrack.
    @Property({ type: "varchar", length: 3 })
    currency: string;

    @Property({ type: "timestamptz", nullable: true })
    validUntil?: Date | null;

    // TODO revisar: status (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // status: string;

    @ManyToOne(() => User, { index: true })
    createdBy: User;

    @Property({ type: 'varchar', length: 10, default: 'pending' })
    decisionStatus: 'pending' | 'accepted' | 'rejected' = 'pending';

    @ManyToOne(() => User, { nullable: true, index: true, deleteRule: 'restrict' })
    decidedBy?: User | null;

    @Property({ type: 'timestamptz', nullable: true })
    decidedAt?: Date | null;
}
