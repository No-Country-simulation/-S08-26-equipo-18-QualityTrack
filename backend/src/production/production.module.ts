import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import {
  MaterialsController,
  RouteSheetsController,
  OperationsController,
  AssignedMaterialsController,
  PersonnelController,
  OrderProductionController,
} from './production.controller';
@Module({
  controllers: [
    MaterialsController,
    RouteSheetsController,
    OperationsController,
    AssignedMaterialsController,
    PersonnelController,
    OrderProductionController,
  ],
  providers: [ProductionService],
})
export class ProductionModule {}
