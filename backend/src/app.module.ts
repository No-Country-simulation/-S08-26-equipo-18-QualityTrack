import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { UsersModule } from './users/users.module';
import { CommercialModule } from './commercial/commercial.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        MikroOrmModule.forRoot(databaseConfig),
        AuthModule,
        ClientsModule,
        UsersModule,
        CommercialModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
