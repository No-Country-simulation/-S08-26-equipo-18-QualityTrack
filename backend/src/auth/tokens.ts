import { createHash, randomBytes } from "node:crypto";

export interface AccessTokenPayload {
    sub: string;
    sid: string;
}

// Opaco a propósito: su validez la decide la base de datos, no una firma.
export function generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}
