import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";

// SSL habilitado por defecto (Supabase lo exige). Poner DB_SSL=false para local.
const useSsl = process.env.DB_SSL !== "false";

export default defineConfig({
    metadataProvider: ReflectMetadataProvider,
    extensions: [Migrator],

    entities: ["./dist/src/entities"],
    entitiesTs: ["./src/entities"],

    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    dbName: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,

    driverOptions: useSsl
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : {},

    migrations: {
        path: "./dist/migrations",
        pathTs: "./migrations",
        tableName: "mikro_orm_migrations",
        transactional: true,
        emit: "ts",
    },
});
