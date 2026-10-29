import { Module } from '@nestjs/common';
import { AttemptLimiter } from '../links/attempt-limiter';
import { SurgeriesModule } from '../surgeries/surgeries.module';
import { FamilyAccessService } from './family-access.service';
import { FamilyContactsService } from './family-contacts.service';
import { FamilyController } from './family.controller';

// Sai 5 lần trong 15 phút thì khóa 15 phút (theo số điện thoại)
const MINUTE_MS = 60_000;

@Module({
  imports: [SurgeriesModule],
  controllers: [FamilyController],
  providers: [
    FamilyAccessService,
    FamilyContactsService,
    {
      provide: AttemptLimiter,
      useFactory: () =>
        new AttemptLimiter({
          maxFailures: 5,
          windowMs: 15 * MINUTE_MS,
          lockMs: 15 * MINUTE_MS,
        }),
    },
  ],
})
export class FamilyModule {}
