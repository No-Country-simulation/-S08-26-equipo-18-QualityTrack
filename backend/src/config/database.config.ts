import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { SeedManager } from "@mikro-orm/seeder";

// Única configuración de la base: la usan la app (AppModule) y el CLI
// de MikroORM (mikro-orm.config.ts). Vive en src/ para que el build la incluya.

// El CLI de MikroORM no lee .env por su cuenta. En CI no hay archivo
// y las variables llegan del entorno, por eso su ausencia no es un error.
try {
    process.loadEnvFile();
} catch {}

const useSsl = process.env.DB_SSL !== "false";

export default defineConfig({
    metadataProvider: ReflectMetadataProvider,
    extensions: [Migrator, SeedManager],

    entities: ["./dist/src/entities"],
    entitiesTs: ["./src/entities"],

    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    dbName: process.env.POSTGRES_DB ?? "qualitytrack",
    user: process.env.POSTGRES_USER ?? "qualitytrack",
    password: process.env.POSTGRES_PASSWORD ?? "qualitytrack_dev",
/* 
    driverOptions: useSsl
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : {}, */
        

    migrations: {
        path: "./dist/migrations",
        pathTs: "./migrations",
        tableName: "mikro_orm_migrations",
        transactional: true,
        emit: "ts",

    },

    seeder: {
        path: "./dist/seeders",
        pathTs: "./seeders",
        defaultSeeder: "DatabaseSeeder",
    },
});