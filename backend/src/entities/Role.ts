import { Entity, OneToMany, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { User } from "./User";
import { Collection } from "@mikro-orm/postgresql";

@Entity()
export class Role {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Unique()
    @Property({ type: "varchar" })
    name: string;

    @Property({ type: "varchar" })
    description: string;

    // Relación inversa de User.role.
    // Un rol puede estar asignado a múltiples usuarios.
    @OneToMany(() => User, (user) => user.role)
    users: Collection<User> = new Collection(this);
}