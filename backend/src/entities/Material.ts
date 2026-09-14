import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";

@Entity()
export class Material {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Unique()
    @Property({ type: "varchar", length: 100 })
    materialCode: string;

    @Property({ type: "varchar", length: 500 })
    name: string;

    // TODO revisar: material_type (posible enum, sin definir en el diagrama)
    // @Property({ type: "varchar" })
    // materialType: string;

    @Property({ type: "varchar", length: 5000, nullable: true })
    specification?: string;

    @Property({ type: "varchar", length: 500, nullable: true })
    manufacturer?: string;
}
