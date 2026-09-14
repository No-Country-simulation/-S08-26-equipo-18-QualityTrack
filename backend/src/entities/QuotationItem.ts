import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Quotation } from "./Quotation";

@Entity()
export class QuotationItem {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => Quotation)
    quotation: Quotation;

    @Property({ type: "varchar", length: 5000 })
    description: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    quantity: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    unitPrice: string;

    @Property({ type: "decimal", precision: 14, scale: 2 })
    subtotal: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    notes?: string;
}
