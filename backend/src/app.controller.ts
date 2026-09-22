import { Controller, Dependencies, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Public()
@Controller()
@Dependencies(AppService)
export class AppController {
  constructor(public appService: AppService) {
    this.appService = appService;
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }
  @Get("healthcheck")
  getHealthCheck() {
    return "La api está funcionando correctamente."
  }
}
