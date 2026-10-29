import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { setSessionCookie } from '../auth/session-cookie';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { AddFamilyContactDto } from './dto/add-family-contact.dto';
import { FamilyAccessDto } from './dto/family-access.dto';
import {
  FAMILY_SESSION_MS,
  FamilyAccessService,
} from './family-access.service';
import { FamilyContactsService } from './family-contacts.service';

const ACCESS_LIMIT = {
  default: { limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10), ttl: 60_000 },
};

@Controller()
export class FamilyController {
  constructor(
    private readonly access: FamilyAccessService,
    private readonly contacts: FamilyContactsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle(ACCESS_LIMIT)
  @Post('auth/family-access')
  @HttpCode(HttpStatus.OK)
  async familyAccess(
    @Body() dto: FamilyAccessDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.access.access(dto, ip);
    setSessionCookie(res, this.config, token, FAMILY_SESSION_MS);
    return { user, accessToken: token };
  }

  @Post('surgeries/:id/family-contacts')
  @Roles(Role.STAFF, Role.ADMIN)
  add(
    @Param('id', ParseUUIDPipe) surgeryId: string,
    @Body() dto: AddFamilyContactDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contacts.add(surgeryId, dto, user);
  }

  @Get('surgeries/:id/family-contacts')
  @Roles(Role.STAFF, Role.ADMIN)
  list(@Param('id', ParseUUIDPipe) surgeryId: string) {
    return this.contacts.list(surgeryId);
  }
}
