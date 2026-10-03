import { Module } from '@nestjs/common';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { QualityDeliveriesService } from './quality-deliveries.service';
import {
  QualityController,
  DeliveriesController,
} from './quality-deliveries.controller';
@Module({
  imports: [WorkOrdersModule],
  controllers: [QualityController, DeliveriesController],
  providers: [QualityDeliveriesService],
})
export class QualityDeliveriesModule {}
