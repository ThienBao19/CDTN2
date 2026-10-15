import { Global, Module } from '@nestjs/common';
import { SurgeryAccessService } from './surgery-access.service';

@Global()
@Module({
  providers: [SurgeryAccessService],
  exports: [SurgeryAccessService],
})
export class AccessModule {}
