import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { hash } from "bcryptjs";
import { Role } from "../src/entities/Role";
import { User } from "../src/entities/User";
import { PASSWORD_HASH_ROUNDS } from "../src/auth/password";

// Crea el administrador inicial. No hay registro público, así que sin este
// usuario nadie puede entrar. Las credenciales salen del entorno y nunca del código.
export class DatabaseSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias para crear el administrador inicial.");
        }

        if (await em.findOne(User, { email })) {
            return;
        }

        // El rol lo crea la migración de roles; si falta, las migraciones no se aplicaron.
        const adminRole = await em.findOneOrFail(Role, { name: "Administrador" });

        const admin = new User();
        admin.firstName = process.env.ADMIN_FIRST_NAME ?? "Administrador";
        admin.lastName = process.env.ADMIN_LAST_NAME ?? "QualityTrack";
        admin.email = email;
        admin.password = await hash(password, PASSWORD_HASH_ROUNDS);
        admin.role = adminRole;

        await em.persist(admin).flush();
    }
}
