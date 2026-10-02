import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { hash } from "bcryptjs";
import { Role } from "../src/entities/Role";
import { User } from "../src/entities/User";
import { PASSWORD_HASH_ROUNDS } from "../src/auth/password";
import { isSupportedPassword } from "../src/auth/password-length.validator";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { UserProfileDto } from "../src/users/dto/user-input.dto";

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

        if (!isSupportedPassword(password)) {
            throw new Error("ADMIN_PASSWORD no puede superar los 72 bytes UTF-8.");
        }

        const profile = plainToInstance(UserProfileDto, {
            firstName: process.env.ADMIN_FIRST_NAME ?? "Administrador",
            lastName: process.env.ADMIN_LAST_NAME ?? "QualityTrack",
            email,
            dni: process.env.ADMIN_DNI,
        });
        if (validateSync(profile).length) {
            throw new Error("El administrador inicial requiere nombre, apellido y email válidos y ADMIN_DNI de 7 u 8 dígitos.");
        }
        if (await em.findOne(User, { dni: profile.dni })) {
            throw new Error("ADMIN_DNI ya corresponde a otra cuenta; usar o reactivar esa cuenta.");
        }

        // El rol lo crea la migración de roles; si falta, las migraciones no se aplicaron.
        const adminRole = await em.findOneOrFail(Role, { name: "Administrador" });

        const admin = new User();
        admin.firstName = profile.firstName;
        admin.lastName = profile.lastName;
        admin.email = profile.email;
        admin.dni = profile.dni;
        admin.password = await hash(password, PASSWORD_HASH_ROUNDS);
        admin.role = adminRole;

        try {
            await em.persist(admin).flush();
        } catch (error) {
            if (error instanceof UniqueConstraintViolationException) {
                throw new Error("Ya existe una cuenta con ese email o DNI.");
            }
            throw error;
        }
    }
}
