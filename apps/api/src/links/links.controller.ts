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
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post()
  @Roles(Role.FAMILY)
  link(@Body() dto: CreateLinkDto, @CurrentUser() user: AuthUser) {
    return this.links.link(user, dto.code);
  }

  @Get()
  @Roles(Role.FAMILY, Role.ADMIN)
  list(@Query() query: ListLinksDto, @CurrentUser() user: AuthUser) {
    return this.links.list(user, query.surgeryId);
  }

  @Delete(':id')
  @Roles(Role.FAMILY, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.links.revoke(user, id);
  }
}
