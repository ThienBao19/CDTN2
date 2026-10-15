import { Controller, Get, Ip, Param, ParseUUIDPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { MyService } from './my.service';

@Controller('my')
@Roles(Role.FAMILY)
export class MyController {
  constructor(private readonly my: MyService) {}

  @Get('surgeries')
  surgeries(@CurrentUser() user: AuthUser) {
    return this.my.surgeries(user);
  }

  @Get('surgeries/:id')
  surgery(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.my.surgery(user, id, ip);
  }
}
