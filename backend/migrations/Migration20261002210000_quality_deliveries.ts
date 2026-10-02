import { Migration } from '@mikro-orm/migrations';

export class Migration20261002210000_quality_deliveries extends Migration {
  override name = 'Migration20261002210000_quality_deliveries';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "quality_control" add "updated_by_id" int null, add "updated_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "quality_control" add constraint "quality_control_updated_by_id_foreign" foreign key ("updated_by_id") references "user" ("id") on delete no action;`,
    );
    this.addSql(
      `create index "quality_control_updated_by_id_index" on "quality_control" ("updated_by_id");`,
    );

    this.addSql(
      `alter table "delivery" add "created_by_id" int null, add "updated_by_id" int null;`,
    );
    this.addSql(
      `alter table "delivery" add constraint "delivery_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on delete no action;`,
    );
    this.addSql(
      `alter table "delivery" add constraint "delivery_updated_by_id_foreign" foreign key ("updated_by_id") references "user" ("id") on delete no action;`,
    );
    this.addSql(`alter table "delivery" alter column "notes" drop not null;`);
    this.addSql(
      `create index "delivery_created_by_id_index" on "delivery" ("created_by_id");`,
    );
    this.addSql(
      `create index "delivery_updated_by_id_index" on "delivery" ("updated_by_id");`,
    );
  }

  override down(): void | Promise<void> {
    // Keep notes nullable: rolling back must preserve deliveries without notes.
    this.addSql(
      `alter table "delivery" drop constraint "delivery_created_by_id_foreign";`,
    );
    this.addSql(
      `alter table "delivery" drop constraint "delivery_updated_by_id_foreign";`,
    );

    this.addSql(
      `alter table "quality_control" drop constraint "quality_control_updated_by_id_foreign";`,
    );

    this.addSql(`drop index "delivery_created_by_id_index";`);
    this.addSql(`drop index "delivery_updated_by_id_index";`);
    this.addSql(
      `alter table "delivery" drop column "created_by_id", drop column "updated_by_id";`,
    );

    this.addSql(`drop index "quality_control_updated_by_id_index";`);
    this.addSql(
      `alter table "quality_control" drop column "updated_by_id", drop column "updated_at";`,
    );
  }
}
