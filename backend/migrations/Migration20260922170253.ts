import { Migration } from '@mikro-orm/migrations';

export class Migration20260922170253 extends Migration {

  override name = 'Migration20260922170253';

  override up(): void | Promise<void> {
    this.addSql(`create table "client" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "business_name" varchar(1000) not null, "tax_id" int not null, "contact_name" varchar(255) not null, "email" varchar(255) not null, "phone" varchar(255) not null, "address" varchar(255) not null, "city" varchar(255) not null, "province" varchar(255) not null, "notes" varchar(5000) not null);`);

    this.addSql(`create table "document_type" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "name" varchar(255) not null, "description" varchar(5000) null);`);

    this.addSql(`create table "material" ("id" serial primary key, "material_code" varchar(100) not null, "name" varchar(500) not null, "specification" varchar(5000) null, "manufacturer" varchar(500) null);`);
    this.addSql(`alter table "material" add constraint "material_material_code_unique" unique ("material_code");`);

    this.addSql(`create table "role" ("id" serial primary key, "name" varchar(255) not null, "description" varchar(255) not null);`);

    this.addSql(`create table "user" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "role_id" int not null, "email" varchar(255) not null, "password" varchar(255) not null);`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "session" ("id" uuid not null, "user_id" int not null, "remember_me" boolean not null, "created_at" timestamptz not null, "last_used_at" timestamptz not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "refresh_token" ("id" serial primary key, "session_id" uuid not null, "token_hash" varchar(64) not null, "created_at" timestamptz not null, "replaced_at" timestamptz null);`);
    this.addSql(`alter table "refresh_token" add constraint "refresh_token_token_hash_unique" unique ("token_hash");`);

    this.addSql(`create table "request" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "client_id" int not null, "request_number" varchar(100) not null, "title" varchar(500) not null, "description" varchar(5000) not null, "received_at" timestamptz not null, "requested_delivery_date" timestamptz null, "created_by_id" int not null);`);
    this.addSql(`alter table "request" add constraint "request_request_number_unique" unique ("request_number");`);

    this.addSql(`create table "quotation" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "client_id" int not null, "request_id" int not null, "quotation_number" varchar(100) not null, "version" int not null default 1, "description" varchar(5000) not null, "subtotal" numeric(14,2) not null, "tax_amount" numeric(14,2) not null, "currency" varchar(3) not null, "valid_until" timestamptz null, "created_by_id" int not null);`);
    this.addSql(`alter table "quotation" add constraint "quotation_quotation_number_unique" unique ("quotation_number");`);

    this.addSql(`create table "quotation_item" ("id" serial primary key, "quotation_id" int not null, "description" varchar(5000) not null, "quantity" numeric(14,2) not null, "unit_price" numeric(14,2) not null, "subtotal" numeric(14,2) not null, "notes" varchar(5000) null);`);

    this.addSql(`create table "work_order" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "work_order_number" int not null, "title" varchar(500) not null, "description" varchar(5000) not null, "priority" text not null, "status" text not null, "created_by_id" int not null, "planned_start_date" timestamptz not null, "planned_end_date" timestamptz not null, "actual_start_date" timestamptz null, "actual_end_date" timestamptz null);`);
    this.addSql(`alter table "work_order" add constraint "work_order_priority_check" check ("priority" in ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));`);
    this.addSql(`alter table "work_order" add constraint "work_order_status_check" check ("status" in ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));`);

    this.addSql(`create table "route_sheet" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz null, "work_order_id" int not null, "route_number" varchar(100) not null, "instructions" varchar(5000) null, "created_by_id" int not null);`);
    this.addSql(`alter table "route_sheet" add constraint "route_sheet_route_number_unique" unique ("route_number");`);

    this.addSql(`create table "operation" ("id" serial primary key, "route_sheet_id" int not null, "operation_number" varchar(100) not null, "name" varchar(500) not null, "description" varchar(5000) null, "machine" varchar(500) null, "planned_start" timestamptz null, "planned_end" timestamptz null, "actual_start" timestamptz null, "actual_end" timestamptz null, "notes" varchar(5000) null);`);

    this.addSql(`create table "quality_control" ("id" serial primary key, "work_order_id" int not null, "operation_id" int null, "specification" varchar(5000) null, "measured_value" numeric(14,4) null, "expected_value" numeric(14,4) null, "unit" varchar(20) null, "observations" varchar(5000) null, "performed_by_id" int not null, "performed_at" timestamptz null);`);

    this.addSql(`create table "document" ("id" serial primary key, "work_order_id" int null, "request_id" int null, "quotation_id" int null, "document_type_id" int not null, "file_name" varchar(500) not null, "storage_path" varchar(1000) not null, "mime_type" varchar(255) not null, "file_size" int not null, "version" int not null default 1, "uploaded_by_id" int not null, "uploaded_at" timestamptz not null, "description" varchar(5000) null);`);

    this.addSql(`create table "approval" ("id" serial primary key, "workorder_id" int not null, "decided_by_id" int not null, "status" text not null, "decision_at" timestamptz null, "comments" varchar(5000) null);`);
    this.addSql(`alter table "approval" add constraint "approval_status_check" check ("status" in ('PENDING', 'APPROVED', 'REJECTED'));`);

    this.addSql(`create table "work_order_material" ("id" serial primary key, "work_order_id" int not null, "material_id" int not null, "lot_number" varchar(100) null, "quantity" numeric(14,2) not null, "unit" varchar(20) null, "certificate_number" varchar(100) null, "received_at" timestamptz null, "notes" varchar(5000) null);`);

    this.addSql(`create table "work_order_user" ("id" serial primary key, "work_order_id" int not null, "user_id" int not null, "assigned_at" timestamptz not null);`);

    this.addSql(`alter table "user" add constraint "user_role_id_foreign" foreign key ("role_id") references "role" ("id");`);

    this.addSql(`alter table "session" add constraint "session_user_id_foreign" foreign key ("user_id") references "user" ("id");`);

    this.addSql(`alter table "refresh_token" add constraint "refresh_token_session_id_foreign" foreign key ("session_id") references "session" ("id");`);

    this.addSql(`alter table "request" add constraint "request_client_id_foreign" foreign key ("client_id") references "client" ("id");`);
    this.addSql(`alter table "request" add constraint "request_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id");`);

    this.addSql(`alter table "quotation" add constraint "quotation_client_id_foreign" foreign key ("client_id") references "client" ("id");`);
    this.addSql(`alter table "quotation" add constraint "quotation_request_id_foreign" foreign key ("request_id") references "request" ("id");`);
    this.addSql(`alter table "quotation" add constraint "quotation_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id");`);

    this.addSql(`alter table "quotation_item" add constraint "quotation_item_quotation_id_foreign" foreign key ("quotation_id") references "quotation" ("id");`);

    this.addSql(`alter table "work_order" add constraint "work_order_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id");`);

    this.addSql(`alter table "route_sheet" add constraint "route_sheet_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id");`);
    this.addSql(`alter table "route_sheet" add constraint "route_sheet_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id");`);

    this.addSql(`alter table "operation" add constraint "operation_route_sheet_id_foreign" foreign key ("route_sheet_id") references "route_sheet" ("id");`);

    this.addSql(`alter table "quality_control" add constraint "quality_control_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id");`);
    this.addSql(`alter table "quality_control" add constraint "quality_control_operation_id_foreign" foreign key ("operation_id") references "operation" ("id") on delete set null;`);
    this.addSql(`alter table "quality_control" add constraint "quality_control_performed_by_id_foreign" foreign key ("performed_by_id") references "user" ("id");`);

    this.addSql(`alter table "document" add constraint "document_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id") on delete set null;`);
    this.addSql(`alter table "document" add constraint "document_request_id_foreign" foreign key ("request_id") references "request" ("id") on delete set null;`);
    this.addSql(`alter table "document" add constraint "document_quotation_id_foreign" foreign key ("quotation_id") references "quotation" ("id") on delete set null;`);
    this.addSql(`alter table "document" add constraint "document_document_type_id_foreign" foreign key ("document_type_id") references "document_type" ("id");`);
    this.addSql(`alter table "document" add constraint "document_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "user" ("id");`);

    this.addSql(`alter table "approval" add constraint "approval_workorder_id_foreign" foreign key ("workorder_id") references "work_order" ("id");`);
    this.addSql(`alter table "approval" add constraint "approval_decided_by_id_foreign" foreign key ("decided_by_id") references "user" ("id");`);

    this.addSql(`alter table "work_order_material" add constraint "work_order_material_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id");`);
    this.addSql(`alter table "work_order_material" add constraint "work_order_material_material_id_foreign" foreign key ("material_id") references "material" ("id");`);

    this.addSql(`alter table "work_order_user" add constraint "work_order_user_work_order_id_foreign" foreign key ("work_order_id") references "work_order" ("id");`);
    this.addSql(`alter table "work_order_user" add constraint "work_order_user_user_id_foreign" foreign key ("user_id") references "user" ("id");`);
  }

}
