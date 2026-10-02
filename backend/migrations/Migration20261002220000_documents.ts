import { Migration } from '@mikro-orm/migrations';

export class Migration20261002220000_documents extends Migration {
  override name = 'Migration20261002220000_documents';

  override up(): void | Promise<void> {
    // NOT VALID preserves pre-existing orphans; PostgreSQL still checks new writes.
    // Catalog names are semantic, never assumed to have fixed IDs.
    this
      .addSql(`insert into document_type (name,description,created_at,updated_at)
      select v.name,v.description,now(),now() from (values
        ('Plano de ingenieria','Planos y dibujos de la pieza.'),
        ('Certificado de materia prima','Certificados del material utilizado.'),
        ('Orden de compra del cliente','Respaldo comercial del pedido.'),
        ('Especificacion tecnica','Requisitos y tolerancias del trabajo.'),
        ('Informe de calidad y ensayos','Inspecciones y ensayos realizados.'),
        ('Remito de despacho','Respaldo de la entrega.')
      ) as v(name,description)
      where not exists (select 1 from document_type t where lower(trim(t.name))=lower(v.name));`);

    this.addSql(
      `alter table "document" drop constraint "document_quotation_id_foreign";`,
    );
    this.addSql(
      `alter table "document" drop constraint "document_request_id_foreign";`,
    );
    this.addSql(
      `alter table "document" drop constraint "document_work_order_id_foreign";`,
    );

    this.addSql(`alter table "document" add "sha256" varchar(64) null;`);
    this.addSql(
      `alter table "document" add constraint "document_quotation_id_foreign" foreign key ("quotation_id") references "quotation" ("id") on delete no action;`,
    );
    this.addSql(
      `alter table "document" add constraint "document_request_id_foreign" foreign key ("request_id") references "request" ("id") on delete no action;`,
    );
    this.addSql(
      `alter table "document" add constraint "document_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id") on delete no action;`,
    );
    this.addSql(
      `alter table "document" add constraint "document_has_parent" check (work_order_id is not null or request_id is not null or quotation_id is not null) not valid;`,
    );
  }

  override down(): void | Promise<void> {
    // Files and catalog types are retained; removing them would destroy evidence.
    this.addSql(
      `alter table "document" drop constraint "document_work_order_id_foreign";`,
    );
    this.addSql(
      `alter table "document" drop constraint "document_request_id_foreign";`,
    );
    this.addSql(
      `alter table "document" drop constraint "document_quotation_id_foreign";`,
    );

    this.addSql(
      `alter table "document" drop constraint "document_has_parent";`,
    );
    this.addSql(`alter table "document" drop column "sha256";`);
    this.addSql(
      `alter table "document" add constraint "document_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id") on delete set null;`,
    );
    this.addSql(
      `alter table "document" add constraint "document_request_id_foreign" foreign key ("request_id") references "request" ("id") on delete set null;`,
    );
    this.addSql(
      `alter table "document" add constraint "document_quotation_id_foreign" foreign key ("quotation_id") references "quotation" ("id") on delete set null;`,
    );
  }
}
