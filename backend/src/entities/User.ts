import { Entity, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import { Role } from "./Role";

@Entity()
export class User extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({ type: "varchar" })
    firstName: string;

    @Property({ type: "varchar" })
    lastName: string;

    // Se estableció una relación ManyToOne porque un rol general
    // puede estar asignado a múltiples usuarios, mientras que cada
    // usuario tiene un único rol dentro del sistema.
    @ManyToOne(() => Role)
    role: Role;
    
    @Unique()
    @Property({ type: "varchar" }) 
    email: string;

    @Property({ type: "varchar" })
    password: string;

}