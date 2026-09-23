import { Migration } from '@mikro-orm/migrations';

export class Migration20260922180709 extends Migration {

  override name = 'Migration20260922180709';

  override up(): void | Promise<void> {
    this.addSql(`alter table "client" add "is_active" boolean not null default true;`);
    this.addSql(`alter table "client" alter column "address" drop not null;`);
    this.addSql(`alter table "client" alter column "city" drop not null;`);
    this.addSql(`alter table "client" alter column "contact_name" drop not null;`);
    this.addSql(`alter table "client" alter column "notes" drop not null;`);
    this.addSql(`alter table "client" alter column "province" drop not null;`);
    this.addSql(`alter table "client" alter column "tax_id" type varchar(11) using ("tax_id"::varchar(11));`);
    this.addSql(`create index "client_business_name_index" on "client" ("business_name");`);
    this.addSql(`alter table "client" add constraint "client_tax_id_unique" unique ("tax_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "client_business_name_index";`);
    this.addSql(`alter table "client" drop constraint "client_tax_id_unique";`);
    this.addSql(`alter table "client" drop column "is_active";`);
    this.addSql(`alter table "client" alter column "tax_id" type int using ("tax_id"::int);`);
    this.addSql(`alter table "client" alter column "contact_name" set not null;`);
    this.addSql(`alter table "client" alter column "address" set not null;`);
    this.addSql(`alter table "client" alter column "city" set not null;`);
    this.addSql(`alter table "client" alter column "province" set not null;`);
    this.addSql(`alter table "client" alter column "notes" set not null;`);
  }

}
