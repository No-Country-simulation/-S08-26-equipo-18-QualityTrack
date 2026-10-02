import { Module } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import {
  RequestsController,
  QuotationsController,
} from './commercial.controller';

@Module({
  controllers: [RequestsController, QuotationsController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
