import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { DEFAULT_ACCESS_TOKEN_TTL_SECONDS } from "./session-policy";

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
                signOptions: {
                    algorithm: "HS256",
                    expiresIn: Number(config.get("JWT_ACCESS_TTL")) || DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
                },
                verifyOptions: { algorithms: ["HS256"] },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        // Guard global: cualquier ruta nueva nace protegida.
        { provide: APP_GUARD, useClass: JwtAuthGuard },
    ],
})
export class AuthModule {}
