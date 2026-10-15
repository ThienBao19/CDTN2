import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './access/access.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { LinksModule } from './links/links.module';
import { MyModule } from './my/my.module';
import { PatientsModule } from './patients/patients.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { StatusesModule } from './statuses/statuses.module';
import { SurgeriesModule } from './surgeries/surgeries.module';
import { TrackingCodesModule } from './tracking-codes/tracking-codes.module';

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
    StatusesModule,
    HealthModule,
    AuthModule,
    RoomsModule,
    PatientsModule,
    SurgeriesModule,
    TrackingCodesModule,
    LinksModule,
    MyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
