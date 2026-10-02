import { Migration } from '@mikro-orm/migrations';

export class Migration20261002143000_user_profile_status extends Migration {
  override name = 'Migration20261002143000_user_profile_status';

  override up(): void {
    this.addSql('alter table "user" add "dni" varchar(8) null;');
    this.addSql(
      'alter table "user" add "is_active" boolean not null default true;',
    );
    this.addSql(
      'alter table "user" add constraint "user_dni_unique" unique ("dni");',
    );
  }

  override down(): void {
    this.addSql('alter table "user" drop constraint "user_dni_unique";');
    this.addSql(
      'alter table "user" drop column "dni", drop column "is_active";',
    );
  }
}
