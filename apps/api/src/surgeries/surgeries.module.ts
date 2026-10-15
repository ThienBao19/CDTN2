import { Module } from '@nestjs/common';
import { SurgeriesController } from './surgeries.controller';
import { SurgeriesService } from './surgeries.service';
import { SurgeryStatusService } from './surgery-status.service';

@Module({
  controllers: [SurgeriesController],
  providers: [SurgeriesService, SurgeryStatusService],
  exports: [SurgeriesService],
})
export class SurgeriesModule {}
