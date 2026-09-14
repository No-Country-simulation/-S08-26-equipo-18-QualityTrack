import { OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { User } from "./User";
import { Collection } from "@mikro-orm/postgresql";

export class Role {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({ type: "varchar" })
    name: string;

    @Property({ type: "varchar" })
    description: string;

    @OneToMany(() => User, (user) => user.role)
    users: Collection<User> = new Collection(this);
}