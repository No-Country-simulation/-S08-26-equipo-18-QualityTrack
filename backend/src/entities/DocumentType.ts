import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";

@Entity()
export class DocumentType extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({ type: "varchar", length: 255 })
    name: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    description?: string;
}
