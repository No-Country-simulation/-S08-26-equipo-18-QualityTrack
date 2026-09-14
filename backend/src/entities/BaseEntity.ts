import { Property } from "@mikro-orm/decorators/legacy";

export abstract class BaseEntity {
    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date(), nullable: true })
    updatedAt?: Date = new Date();
}