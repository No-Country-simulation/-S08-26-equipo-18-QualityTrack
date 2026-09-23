import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { toAuthUser } from "./auth-user";
import { CurrentAuth } from "./current-auth.decorator";
import type { RequestAuth } from "./current-auth.decorator";
import { LoginResponseDto, MeResponseDto, TokenPairResponseDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Public } from "./public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Iniciar sesión con correo y contraseña" })
    @ApiOkResponse({ type: LoginResponseDto })
    @ApiUnauthorizedResponse({ description: "Correo electrónico o contraseña incorrectos." })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Pública porque se llama justamente cuando el token de acceso ya venció.
    @Public()
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Renovar la sesión con el token de renovación" })
    @ApiOkResponse({ type: TokenPairResponseDto })
    @ApiUnauthorizedResponse({ description: "Token inexistente, sesión vencida, o token ya usado (cierra todas las sesiones)" })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    // Cierra solo la sesión de este dispositivo; las demás siguen abiertas.
    @Post("logout")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Cerrar la sesión de este dispositivo" })
    @ApiNoContentResponse({ description: "Sesión cerrada" })
    @ApiUnauthorizedResponse({ description: "Sin sesión vigente" })
    async logout(@CurrentAuth() auth: RequestAuth): Promise<void> {
        await this.authService.logout(auth.session);
    }

    @Get("me")
    @ApiBearerAuth("access-token")
    @ApiOperation({ summary: "Quién es la persona con la sesión abierta" })
    @ApiOkResponse({ type: MeResponseDto })
    @ApiUnauthorizedResponse({ description: "Sin sesión vigente" })
    me(@CurrentAuth() auth: RequestAuth) {
        return { user: toAuthUser(auth.user) };
    }
}
