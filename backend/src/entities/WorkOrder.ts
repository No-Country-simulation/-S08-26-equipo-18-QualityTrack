import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";

@Entity()
export class WorkOrder extends BaseEntity {
    @PrimaryKey({ type: "integer" })
    id: number;

    @Property({type: "integer"})
    workOrderNumber: number;

    @Property({type: "varchar", length: 500})
    title: string;

    @Property({type: "varchar", length: 5000})
    description: string;

    /* TODO Definir status, priority */

    @Property({type: "integer"})
    createdBy: number;

    @Property({type: "timestamptz"})
    plannedStartDate: Date;

    @Property({type: "timestamptz"})
    plannedEndDate: Date;

    @Property({type: "timestamptz"})
    actualStartDate: Date;
 
    @Property({type: "timestamptz"})
    actualEndDate: Date;
}