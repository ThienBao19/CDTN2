import { Module } from '@nestjs/common';
import { TrackingCodesModule } from '../tracking-codes/tracking-codes.module';
import { AttemptLimiter } from './attempt-limiter';
import { LINK_LIMITER_OPTIONS, LinksService } from './links.service';
import { LinkExpiryService } from './link-expiry.service';
import { LinksController } from './links.controller';

@Module({
  imports: [TrackingCodesModule],
  controllers: [LinksController],
  exports: [LinkExpiryService],
  providers: [
    LinksService,
    LinkExpiryService,
    {
      provide: AttemptLimiter,
      useFactory: () => new AttemptLimiter(LINK_LIMITER_OPTIONS),
    },
  ],
})
export class LinksModule {}
