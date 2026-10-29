import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { validateEnv } from './config/env.validation';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { FamilyModule } from './family/family.module';
import { HealthModule } from './health/health.module';
import { LinksModule } from './links/links.module';
import { MyModule } from './my/my.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PatientsModule } from './patients/patients.module';
import { PrismaModule } from './prisma/prisma.module';
import { PushModule } from './push/push.module';
import { RoomsModule } from './rooms/rooms.module';
import { StatusesModule } from './statuses/statuses.module';
import { SurgeriesModule } from './surgeries/surgeries.module';

const DEFAULT_RATE_LIMIT = 300;
const RATE_WINDOW_MS = 60_000;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: RATE_WINDOW_MS,
        limit: Number(process.env.RATE_LIMIT ?? DEFAULT_RATE_LIMIT),
      },
    ]),
    PrismaModule,
    AuditModule,
    AccessModule,
    PushModule,
    EventsModule,
    NotificationsModule,
    StatusesModule,
    HealthModule,
    AuthModule,
    RoomsModule,
    PatientsModule,
    SurgeriesModule,
    FamilyModule,
    LinksModule,
    MyModule,
    DevicesModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
