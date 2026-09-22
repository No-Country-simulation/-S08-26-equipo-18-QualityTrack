import { Migration } from '@mikro-orm/migrations';

export class Migration20260922171222_schema_fixes extends Migration {

  override name = 'Migration20260922171222_schema_fixes';

  override up(): void | Promise<void> {
    this.addSql(`create table "delivery" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "client_id" int null, "work_order_id" int not null, "delivery_date" timestamptz not null, "quantity" int not null, "notes" varchar(5000) not null);`);
    this.addSql(`create index "delivery_client_id_index" on "delivery" ("client_id");`);
    this.addSql(`create index "delivery_work_order_id_index" on "delivery" ("work_order_id");`);

    this.addSql(`alter table "role" add constraint "role_name_unique" unique ("name");`);

    this.addSql(`create index "user_role_id_index" on "user" ("role_id");`);

    this.addSql(`create index "session_user_id_index" on "session" ("user_id");`);

    this.addSql(`create index "refresh_token_session_id_index" on "refresh_token" ("session_id");`);

    this.addSql(`create index "request_client_id_index" on "request" ("client_id");`);
    this.addSql(`create index "request_created_by_id_index" on "request" ("created_by_id");`);

    this.addSql(`create index "quotation_client_id_index" on "quotation" ("client_id");`);
    this.addSql(`create index "quotation_request_id_index" on "quotation" ("request_id");`);
    this.addSql(`create index "quotation_created_by_id_index" on "quotation" ("created_by_id");`);

    this.addSql(`create index "quotation_item_quotation_id_index" on "quotation_item" ("quotation_id");`);

    this.addSql(`create index "work_order_created_by_id_index" on "work_order" ("created_by_id");`);

    this.addSql(`create index "route_sheet_work_order_id_index" on "route_sheet" ("work_order_id");`);
    this.addSql(`create index "route_sheet_created_by_id_index" on "route_sheet" ("created_by_id");`);

    this.addSql(`create index "operation_route_sheet_id_index" on "operation" ("route_sheet_id");`);

    this.addSql(`create index "quality_control_work_order_id_index" on "quality_control" ("work_order_id");`);
    this.addSql(`create index "quality_control_operation_id_index" on "quality_control" ("operation_id");`);
    this.addSql(`create index "quality_control_performed_by_id_index" on "quality_control" ("performed_by_id");`);

    this.addSql(`create index "document_work_order_id_index" on "document" ("work_order_id");`);
    this.addSql(`create index "document_request_id_index" on "document" ("request_id");`);
    this.addSql(`create index "document_quotation_id_index" on "document" ("quotation_id");`);
    this.addSql(`create index "document_document_type_id_index" on "document" ("document_type_id");`);
    this.addSql(`create index "document_uploaded_by_id_index" on "document" ("uploaded_by_id");`);

    this.addSql(`create index "approval_workorder_id_index" on "approval" ("workorder_id");`);
    this.addSql(`create index "approval_decided_by_id_index" on "approval" ("decided_by_id");`);

    this.addSql(`create index "work_order_material_work_order_id_index" on "work_order_material" ("work_order_id");`);
    this.addSql(`create index "work_order_material_material_id_index" on "work_order_material" ("material_id");`);

    this.addSql(`create index "work_order_user_work_order_id_index" on "work_order_user" ("work_order_id");`);
    this.addSql(`create index "work_order_user_user_id_index" on "work_order_user" ("user_id");`);

    this.addSql(`alter table "delivery" add constraint "delivery_client_id_foreign" foreign key ("client_id") references "client" ("id") on delete set null;`);
    this.addSql(`alter table "delivery" add constraint "delivery_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "delivery" cascade;`);

    this.addSql(`drop index "approval_workorder_id_index";`);
    this.addSql(`drop index "approval_decided_by_id_index";`);

    this.addSql(`drop index "document_work_order_id_index";`);
    this.addSql(`drop index "document_request_id_index";`);
    this.addSql(`drop index "document_quotation_id_index";`);
    this.addSql(`drop index "document_document_type_id_index";`);
    this.addSql(`drop index "document_uploaded_by_id_index";`);

    this.addSql(`drop index "operation_route_sheet_id_index";`);

    this.addSql(`drop index "quality_control_work_order_id_index";`);
    this.addSql(`drop index "quality_control_operation_id_index";`);
    this.addSql(`drop index "quality_control_performed_by_id_index";`);

    this.addSql(`drop index "quotation_client_id_index";`);
    this.addSql(`drop index "quotation_request_id_index";`);
    this.addSql(`drop index "quotation_created_by_id_index";`);

    this.addSql(`drop index "quotation_item_quotation_id_index";`);

    this.addSql(`drop index "refresh_token_session_id_index";`);

    this.addSql(`drop index "request_client_id_index";`);
    this.addSql(`drop index "request_created_by_id_index";`);

    this.addSql(`alter table "role" drop constraint "role_name_unique";`);

    this.addSql(`drop index "route_sheet_work_order_id_index";`);
    this.addSql(`drop index "route_sheet_created_by_id_index";`);

    this.addSql(`drop index "session_user_id_index";`);

    this.addSql(`drop index "user_role_id_index";`);

    this.addSql(`drop index "work_order_created_by_id_index";`);

    this.addSql(`drop index "work_order_material_work_order_id_index";`);
    this.addSql(`drop index "work_order_material_material_id_index";`);

    this.addSql(`drop index "work_order_user_work_order_id_index";`);
    this.addSql(`drop index "work_order_user_user_id_index";`);
  }

}
