import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Todas las rutas exigen sesión salvo las marcadas con este decorador.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
