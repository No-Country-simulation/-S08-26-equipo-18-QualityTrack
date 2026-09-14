import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";

@Entity()
export class Client extends BaseEntity {
    @PrimaryKey({ type: "integer"})
    id: number;

    @Property({ type: "varchar", length: 1000})
    businessName: string;

    @Property({type: "integer"})
    taxId: number;

    @Property({type: "varchar"})
    contactName: string;

    @Property({type: "varchar"})
    email: string;
    
    @Property({type: "varchar"})
    phone: string;

    @Property({type: "varchar"})
    address: string;
    
    @Property({type: "varchar"})
    city: string;
    
    @Property({type: "varchar"})
    province: string;

    @Property({type: "varchar", length: 5000})
    notes: string;
    
    /* TODO is_active -> soft delete??  */
}