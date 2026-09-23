import { Migration } from '@mikro-orm/migrations';

export class Migration20260922170303_roles extends Migration {

  override name = 'Migration20260922170303_roles';

  // Los nombres coinciden con los que el frontend usa para decidir qué mostrar.
  override up(): void | Promise<void> {
    this.addSql(`insert into "role" ("name", "description") values
      ('Administrador', 'Gestiona usuarios, permisos y tiene acceso total al sistema'),
      ('Supervisor', 'Supervisa órdenes de trabajo, cotizaciones y entregas'),
      ('Producción', 'Consulta información técnica y registra operaciones'),
      ('Calidad', 'Registra controles de calidad y sus resultados'),
      ('Administración', 'Gestiona clientes, solicitudes, cotizaciones y documentación de entrega');`);
  }

  override down(): void | Promise<void> {
    this.addSql(`delete from "role" where "name" in ('Administrador', 'Supervisor', 'Producción', 'Calidad', 'Administración');`);
  }

}
