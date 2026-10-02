import { Migration } from '@mikro-orm/migrations';

export class Migration20261002200000_production extends Migration {
  override up(): void {
    this.addSql(`do $$ begin
      if exists (select 1 from operation group by route_sheet_id, operation_number having count(*) > 1) then
        raise exception 'Duplicate operation numbers in a route sheet: review historical records before migrating';
      end if;
      if exists (select 1 from work_order_user group by work_order_id, user_id having count(*) > 1) then
        raise exception 'Duplicate personnel assignments: review historical records before migrating';
      end if;
    end $$;`);
    this.addSql(
      `create sequence route_sheet_number_seq as bigint start with 1;`,
    );
    this.addSql(
      `select setval('route_sheet_number_seq', greatest(1, coalesce((select max(substring(route_number from '^HR-([0-9]+)$')::bigint) from route_sheet),0)+1),false);`,
    );
    this.addSql(
      `alter table operation add created_by_id int null, add executed_by_id int null;`,
    );
    this.addSql(
      `alter table operation add constraint operation_created_by_id_foreign foreign key (created_by_id) references "user" (id) on delete no action;`,
    );
    this.addSql(
      `alter table operation add constraint operation_executed_by_id_foreign foreign key (executed_by_id) references "user" (id) on delete no action;`,
    );
    this.addSql(
      `create index operation_created_by_id_index on operation (created_by_id);`,
    );
    this.addSql(
      `create index operation_executed_by_id_index on operation (executed_by_id);`,
    );
    this.addSql(
      `alter table operation add constraint operation_route_sheet_id_operation_number_unique unique (route_sheet_id, operation_number);`,
    );
    this.addSql(`alter table work_order_material add assigned_by_id int null;`);
    this.addSql(
      `alter table work_order_material add constraint work_order_material_assigned_by_id_foreign foreign key (assigned_by_id) references "user" (id) on delete no action;`,
    );
    this.addSql(
      `create index work_order_material_assigned_by_id_index on work_order_material (assigned_by_id);`,
    );
    this.addSql(
      `alter table work_order_user add assigned_by_id int null, add unassigned_at timestamptz null, add unassigned_by_id int null;`,
    );
    this.addSql(
      `alter table work_order_user add constraint work_order_user_assigned_by_id_foreign foreign key (assigned_by_id) references "user" (id) on delete no action;`,
    );
    this.addSql(
      `alter table work_order_user add constraint work_order_user_unassigned_by_id_foreign foreign key (unassigned_by_id) references "user" (id) on delete no action;`,
    );
    this.addSql(
      `create index work_order_user_assigned_by_id_index on work_order_user (assigned_by_id);`,
    );
    this.addSql(
      `create index work_order_user_unassigned_by_id_index on work_order_user (unassigned_by_id);`,
    );
    this.addSql(
      `create unique index work_order_user_active_unique on work_order_user (work_order_id, user_id) where unassigned_at is null;`,
    );
  }
  override down(): void {
    this.addSql(`drop sequence route_sheet_number_seq;`);
    this.addSql(
      `alter table operation drop constraint operation_created_by_id_foreign, drop constraint operation_executed_by_id_foreign, drop constraint operation_route_sheet_id_operation_number_unique;`,
    );
    this.addSql(`drop index operation_created_by_id_index;`);
    this.addSql(`drop index operation_executed_by_id_index;`);
    this.addSql(
      `alter table operation drop column created_by_id, drop column executed_by_id;`,
    );
    this.addSql(
      `alter table work_order_material drop constraint work_order_material_assigned_by_id_foreign;`,
    );
    this.addSql(`drop index work_order_material_assigned_by_id_index;`);
    this.addSql(`alter table work_order_material drop column assigned_by_id;`);
    this.addSql(
      `alter table work_order_user drop constraint work_order_user_assigned_by_id_foreign, drop constraint work_order_user_unassigned_by_id_foreign;`,
    );
    this.addSql(`drop index work_order_user_assigned_by_id_index;`);
    this.addSql(`drop index work_order_user_unassigned_by_id_index;`);
    this.addSql(`drop index work_order_user_active_unique;`);
    this.addSql(
      `alter table work_order_user drop column assigned_by_id, drop column unassigned_at, drop column unassigned_by_id;`,
    );
  }
}
