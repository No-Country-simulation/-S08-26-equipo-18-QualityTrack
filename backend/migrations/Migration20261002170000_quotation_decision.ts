import { Migration } from '@mikro-orm/migrations';

export class Migration20261002170000_quotation_decision extends Migration {
  override name = 'Migration20261002170000_quotation_decision';
  override up(): void {
    this.addSql(
      `alter table "quotation" add "decision_status" varchar(10) not null default 'pending', add "decided_by_id" integer null, add "decided_at" timestamptz null;`,
    );
    this.addSql(
      'create index "quotation_decided_by_id_index" on "quotation" ("decided_by_id");',
    );
    this.addSql(
      'alter table "quotation" add constraint "quotation_decided_by_id_foreign" foreign key ("decided_by_id") references "user" ("id") on update cascade on delete restrict;',
    );
    this.addSql(
      `alter table "quotation" add constraint "quotation_decision_consistent" check ((decision_status = 'pending' and decided_by_id is null and decided_at is null) or (decision_status in ('accepted', 'rejected') and decided_by_id is not null and decided_at is not null));`,
    );
  }
  override down(): void {
    this.addSql(
      'alter table "quotation" drop constraint "quotation_decision_consistent", drop constraint "quotation_decided_by_id_foreign";',
    );
    this.addSql('drop index "quotation_decided_by_id_index";');
    this.addSql(
      'alter table "quotation" drop column "decision_status", drop column "decided_by_id", drop column "decided_at";',
    );
  }
}
