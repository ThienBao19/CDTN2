import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { SURGERY_WORKFLOW } from '../statuses/statuses.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

// FR-12: danh mục phòng và trạng thái (kèm nội dung thông báo)
@Controller('admin')
@Roles(Role.ADMIN)
export class AdminCatalogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get('rooms')
  rooms() {
    return this.prisma.room.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('rooms')
  async createRoom(@Body() dto: CreateRoomDto, @CurrentUser() admin: AuthUser) {
    try {
      const room = await this.prisma.room.create({
        data: { ...dto, name: dto.name.trim() },
      });
      await this.audit.log({
        userId: admin.id,
        action: 'CREATE',
        entityType: 'room',
        entityId: room.id,
      });
      return room;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Tên phòng đã tồn tại');
      throw error;
    }
  }

  @Put('rooms/:id')
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() admin: AuthUser,
  ) {
    const exists = await this.prisma.room.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy phòng');
    try {
      const room = await this.prisma.room.update({ where: { id }, data: dto });
      await this.audit.log({
        userId: admin.id,
        action: 'UPDATE',
        entityType: 'room',
        entityId: id,
      });
      return room;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Tên phòng đã tồn tại');
      throw error;
    }
  }

  @Get('statuses')
  statuses() {
    return this.prisma.statusDefinition.findMany({
      where: { workflow: SURGERY_WORKFLOW },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Put('statuses/:id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() admin: AuthUser,
  ) {
    const exists = await this.prisma.statusDefinition.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy trạng thái');
    const status = await this.prisma.statusDefinition.update({
      where: { id },
      data: dto,
    });
    await this.audit.log({
      userId: admin.id,
      action: 'UPDATE',
      entityType: 'status',
      entityId: String(id),
    });
    return status;
  }
}
