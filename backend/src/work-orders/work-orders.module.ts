import { Module } from '@nestjs/common';
import { CommercialModule } from '../commercial/commercial.module';
import { WorkOrdersService } from './work-orders.service';
import {
  WorkOrdersController,
  ApprovalsController,
} from './work-orders.controller';
@Module({
  imports: [CommercialModule],
  controllers: [WorkOrdersController, ApprovalsController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
