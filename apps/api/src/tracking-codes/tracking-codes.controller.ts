import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateTrackingCodeDto } from './dto/create-tracking-code.dto';
import { TrackingCodesService } from './tracking-codes.service';

@Controller()
@Roles(Role.STAFF, Role.ADMIN)
export class TrackingCodesController {
  constructor(private readonly codes: TrackingCodesService) {}

  @Post('surgeries/:id/tracking-codes')
  issue(
    @Param('id', ParseUUIDPipe) surgeryId: string,
    @Body() dto: CreateTrackingCodeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.codes.issue(surgeryId, dto.ttlHours, user);
  }

  @Get('surgeries/:id/tracking-codes')
  list(@Param('id', ParseUUIDPipe) surgeryId: string) {
    return this.codes.listForSurgery(surgeryId);
  }

  @Delete('tracking-codes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.codes.revoke(id, user);
  }
}
