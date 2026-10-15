import { Global, Module } from '@nestjs/common';
import { MyNotificationsController } from './my-notifications.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  controllers: [MyNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
