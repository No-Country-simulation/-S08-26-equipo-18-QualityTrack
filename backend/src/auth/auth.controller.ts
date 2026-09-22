import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { toAuthUser } from "./auth-user";
import { CurrentAuth } from "./current-auth.decorator";
import type { RequestAuth } from "./current-auth.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post("login")
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Pública porque se llama justamente cuando el token de acceso ya venció.
    @Public()
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    // Cierra solo la sesión de este dispositivo; las demás siguen abiertas.
    @Post("logout")
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@CurrentAuth() auth: RequestAuth): Promise<void> {
        await this.authService.logout(auth.session);
    }

    @Get("me")
    me(@CurrentAuth() auth: RequestAuth) {
        return { user: toAuthUser(auth.user) };
    }
}
