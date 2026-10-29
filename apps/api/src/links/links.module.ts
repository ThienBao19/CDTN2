import { Module } from '@nestjs/common';
import { LinkExpiryService } from './link-expiry.service';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

@Module({
  controllers: [LinksController],
  providers: [LinksService, LinkExpiryService],
  exports: [LinkExpiryService],
})
export class LinksModule {}
