import { Module } from '@nestjs/common';
import { MyController } from './my.controller';
import { MyService } from './my.service';

@Module({
  controllers: [MyController],
  providers: [MyService],
})
export class MyModule {}
