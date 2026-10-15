import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SurgeryAccessService } from '../access/surgery-access.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CancelSurgeryDto } from './dto/cancel-surgery.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateSurgeryDto } from './dto/create-surgery.dto';
import { ListSurgeriesDto } from './dto/list-surgeries.dto';
import { UpdateSurgeryDto } from './dto/update-surgery.dto';
import { SurgeriesService } from './surgeries.service';
import { SurgeryStatusService } from './surgery-status.service';

@Controller('surgeries')
export class SurgeriesController {
  constructor(
    private readonly surgeries: SurgeriesService,
    private readonly status: SurgeryStatusService,
    private readonly access: SurgeryAccessService,
  ) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  create(@Body() dto: CreateSurgeryDto, @CurrentUser() user: AuthUser) {
    return this.surgeries.create(dto, user);
  }

  @Get()
  @Roles(Role.STAFF, Role.ADMIN)
  list(@Query() query: ListSurgeriesDto) {
    return this.surgeries.list(query);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.surgeries.findOne(id);
  }

  @Put(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurgeryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.surgeries.update(id, dto, user);
  }

  @Post(':id/cancel')
  @Roles(Role.STAFF, Role.ADMIN)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelSurgeryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.surgeries.cancel(id, dto.reason, user);
  }

  // Ma trận quyền: chỉ nhân viên y tế được cập nhật trạng thái ca
  @Post(':id/status')
  @Roles(Role.STAFF)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.status.change(id, dto, user);
  }

  @Get(':id/history')
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.access.assertCanView(user, id);
    const entries = await this.status.history(id);
    if (user.role !== Role.FAMILY) return entries;
    // Người nhà chỉ thấy tên trạng thái và thời điểm (NFR-07)
    return entries.map((e) => ({
      id: e.id,
      changedAt: e.changedAt,
      status: { code: e.status.code, label: e.status.label },
    }));
  }
}
