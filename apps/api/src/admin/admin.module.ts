import { Module } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

@Module({
  controllers: [
    AdminUsersController,
    AdminCatalogController,
    AdminAuditController,
    AdminStatsController,
  ],
  providers: [AdminUsersService, AdminStatsService],
})
export class AdminModule {}
