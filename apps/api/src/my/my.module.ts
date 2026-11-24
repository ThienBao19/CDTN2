
import { Module } from '@nestjs/common';
import { StatusesModule } from '../statuses/statuses.module';
import { MyController } from './my.controller';
import { MyService } from './my.service';

@Module({
  imports: [StatusesModule],
  controllers: [MyController],
  providers: [MyService],
})
export class MyModule {}
