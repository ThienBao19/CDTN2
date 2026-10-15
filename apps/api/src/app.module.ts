import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

// Các module nghiệp vụ (auth, patients, surgeries, status, tracking-codes,
// links, notifications, admin) sẽ được thêm theo backlog — mục 9.2.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
