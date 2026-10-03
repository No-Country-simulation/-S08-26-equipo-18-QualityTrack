import { Migration } from '@mikro-orm/migrations';

export class Migration20261002190000_commercial_numbers extends Migration {
  override up(): void {
    this.addSql('create sequence request_number_seq as bigint start with 1;');
    this.addSql('create sequence quotation_number_seq as bigint start with 1;');
    // Se conservan los números históricos. Continuar por encima del mayor
    // correlativo que ya utilice el formato SOL-n / COT-n, incluso con ceros.
    this.addSql(
      `select setval('request_number_seq', greatest(1, coalesce((select max(substring(request_number from '^SOL-([0-9]+)$')::bigint) from request), 0) + 1), false);`,
    );
    this.addSql(
      `select setval('quotation_number_seq', greatest(1, coalesce((select max(substring(quotation_number from '^COT-([0-9]+)$')::bigint) from quotation), 0) + 1), false);`,
    );
  }
  override down(): void {
    this.addSql('drop sequence request_number_seq;');
    this.addSql('drop sequence quotation_number_seq;');
  }
}
