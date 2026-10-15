import { Module } from '@nestjs/common';
import { SurgeriesModule } from '../surgeries/surgeries.module';
import { TrackingCodesController } from './tracking-codes.controller';
import { TrackingCodesService } from './tracking-codes.service';

@Module({
  imports: [SurgeriesModule],
  controllers: [TrackingCodesController],
  providers: [TrackingCodesService],
  exports: [TrackingCodesService],
})
export class TrackingCodesModule {}
