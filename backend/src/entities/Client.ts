import { BeforeCreate, BeforeUpdate, Entity, Index, PrimaryKey, Property, Unique } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity";

@Entity()
export class Client extends BaseEntity {
    @PrimaryKey({ type: "integer"})
    id: number;

    // Orden por omisión del listado; el índice lo sostiene cuando la tabla crece.
    @Index()
    @Property({ type: "varchar", length: 1000})
    businessName: string;

    // Texto y no número: un CUIT no se suma ni se ordena como cantidad, pierde los
    // ceros a la izquierda y con once dígitos desborda un entero.
    // El índice único es lo que impide dos fichas para la misma empresa cuando dos
    // altas llegan a la vez.
    @Unique()
    @Property({type: "varchar", length: 11})
    taxId: string;

    @Property({type: "varchar", nullable: true})
    contactName?: string;

    @Property({type: "varchar"})
    email: string;

    @Property({type: "varchar"})
    phone: string;

    @Property({type: "varchar", nullable: true})
    address?: string;

    @Property({type: "varchar", nullable: true})
    city?: string;

    @Property({type: "varchar", nullable: true})
    province?: string;

    @Property({type: "varchar", length: 5000, nullable: true})
    notes?: string;

    // Los clientes no se borran: se desactivan, para que el trabajo ya registrado
    // siga mostrando de quién era.
    @Property({ type: "boolean", default: true })
    isActive: boolean = true;

    // Se guarda solo lo que identifica al número, para que "20-12345678-3" y
    // "20123456783" no queden como dos clientes distintos. El correo se normaliza
    // igual que el de los usuarios.
    @BeforeCreate()
    @BeforeUpdate()
    normalizeFields() {
        this.taxId = this.taxId.replace(/\D/g, "");
        this.email = this.email.trim().toLowerCase();
    }
}
