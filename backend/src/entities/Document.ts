import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { Request } from "./Request";
import { Quotation } from "./Quotation";
import { DocumentType } from "./DocumentType";
import { User } from "./User";

@Entity()
export class Document {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder, { nullable: true, index: true })
    workOrder?: WorkOrder;

    @ManyToOne(() => Request, { nullable: true, index: true })
    request?: Request;

    @ManyToOne(() => Quotation, { nullable: true, index: true })
    quotation?: Quotation;

    @ManyToOne(() => DocumentType, { index: true })
    documentType: DocumentType;

    @Property({ type: "varchar", length: 500 })
    fileName: string;

    @Property({ type: "varchar", length: 1000 })
    storagePath: string;

    @Property({ type: "varchar", length: 255 })
    mimeType: string;

    @Property({ type: "integer" })
    fileSize: number;

    @Property({ type: "integer", default: 1 })
    version: number;

    @ManyToOne(() => User, { index: true })
    uploadedBy: User;

    @Property({ type: "timestamptz", onCreate: () => new Date() })
    uploadedAt: Date = new Date();

    @Property({ type: "varchar", length: 5000, nullable: true })
    description?: string;
}
