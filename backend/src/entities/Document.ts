import { Check, Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { WorkOrder } from "./WorkOrder";
import { Request } from "./Request";
import { Quotation } from "./Quotation";
import { DocumentType } from "./DocumentType";
import { User } from "./User";

@Entity()
@Check({name:'document_has_parent',expression:'work_order_id is not null or request_id is not null or quotation_id is not null'})
export class Document {
    @PrimaryKey({ type: "integer" })
    id: number;

    @ManyToOne(() => WorkOrder, { nullable: true, index: true, deleteRule:'no action' })
    workOrder?: WorkOrder;

    @ManyToOne(() => Request, { nullable: true, index: true, deleteRule:'no action' })
    request?: Request;

    @ManyToOne(() => Quotation, { nullable: true, index: true, deleteRule:'no action' })
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
    description?: string | null;

    @Property({type:'varchar',length:64,nullable:true})
    sha256?: string | null;
}
