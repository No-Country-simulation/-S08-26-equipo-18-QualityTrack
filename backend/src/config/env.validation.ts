// Falla al arrancar si falta configuración obligatoria, en lugar de fallar
// en el primer login con un error difícil de rastrear.
export function validateEnv(config: Record<string, unknown>) {
    const secret = config.JWT_ACCESS_SECRET;

    if (typeof secret !== "string" || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET es obligatoria y debe tener al menos 32 caracteres.");
    }

    return config;
}

export function parseCorsOrigins(value: string | undefined): string[] {
    return (value ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
}
