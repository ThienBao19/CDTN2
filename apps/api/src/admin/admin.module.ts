import { Module } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [
    AdminUsersController,
    AdminCatalogController,
    AdminAuditController,
  ],
  providers: [AdminUsersService],
})
export class AdminModule {}
