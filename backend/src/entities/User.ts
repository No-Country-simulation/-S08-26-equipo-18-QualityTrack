import { Entity, ManyToMany, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";
import {  Role } from "./Role";

@Entity()
export class User extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({ type: "varchar" })
    firstName: string;

    @Property({ type: "varchar" })
    lastName: string;

    @Property({ type: "integer" })
    roleId: Role["id"];
    @ManyToMany(() => Role)
    role?: Role;
    
    @Unique()
    @Property({ type: "varchar" }) 
    email: string;

    @Property({ type: "varchar" })
    password: string;

}