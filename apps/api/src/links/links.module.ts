import { Module } from '@nestjs/common';
import { TrackingCodesModule } from '../tracking-codes/tracking-codes.module';
import { AttemptLimiter } from './attempt-limiter';
import { LINK_LIMITER_OPTIONS, LinksService } from './links.service';
import { LinksController } from './links.controller';

@Module({
  imports: [TrackingCodesModule],
  controllers: [LinksController],
  providers: [
    LinksService,
    {
      provide: AttemptLimiter,
      useFactory: () => new AttemptLimiter(LINK_LIMITER_OPTIONS),
    },
  ],
})
export class LinksModule {}
