import { Migration } from '@mikro-orm/migrations';

export class Migration20261002180000_work_order_origin extends Migration {
  override up(): void {
    this.addSql(`do $$ begin
      if exists (select 1 from work_order group by work_order_number having count(*) > 1) then
        raise exception 'Duplicate work order numbers: resolve with verified data before migrating';
      end if;
      if exists (select 1 from approval group by workorder_id having count(*) > 1) then
        raise exception 'Multiple approvals for a work order: review historical decisions before migrating';
      end if;
    end $$;`);
    this.addSql(
      `create sequence work_order_number_seq as integer start with 1001;`,
    );
    this.addSql(
      `select setval('work_order_number_seq', greatest(1000, coalesce((select max(work_order_number) from work_order), 1000)), true);`,
    );
    this.addSql(
      `alter table work_order add column quotation_id int null, alter column work_order_number set default nextval('work_order_number_seq'::regclass);`,
    );
    this.addSql(
      `alter table work_order add constraint work_order_work_order_number_unique unique (work_order_number);`,
    );
    this.addSql(
      `create index work_order_quotation_id_index on work_order (quotation_id);`,
    );
    this.addSql(
      `alter table work_order add constraint work_order_quotation_id_foreign foreign key (quotation_id) references quotation(id) on update cascade on delete restrict;`,
    );
    this.addSql(
      `alter table approval alter column decided_by_id drop not null, add constraint approval_workorder_id_unique unique (workorder_id);`,
    );
  }
  override down(): void {
    this.addSql(
      `alter table approval drop constraint approval_workorder_id_unique;`,
    );
    this.addSql(
      `alter table work_order drop constraint work_order_work_order_number_unique, drop column quotation_id, alter column work_order_number drop default;`,
    );
    this.addSql(`drop sequence work_order_number_seq;`);
    // No restaurar NOT NULL: las decisiones pendientes no tienen actor inventado.
  }
}
