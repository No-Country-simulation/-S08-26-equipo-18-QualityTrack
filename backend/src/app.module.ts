import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        MikroOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                entities: ["./dist/src/entities"],
                entitiesTs: ["./src/entities"],
                host: configService.get<string>("DB_HOST", "localhost"),
                port: configService.get<number>("DB_PORT", 5432),
                dbName: configService.get<string>("POSTGRES_DB"),
                user: configService.get<string>("POSTGRES_USER"),
                password: configService.get<string>("POSTGRES_PASSWORD"),
                autoLoadEntities: true,
                
            }),
            driver: PostgreSqlDriver,
        })
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
