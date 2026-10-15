import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RemoveDeviceDto } from './dto/remove-device.dto';

// Đăng ký token nhận push (mục 11: POST /devices); tắt thông báo thì xóa token
@Controller('devices')
@Roles(Role.FAMILY)
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(
    @Body() dto: RegisterDeviceDto,
    @CurrentUser() user: AuthUser,
  ) {
    // Một thiết bị đổi tài khoản thì token chuyển sang người dùng mới
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { token: dto.token, platform: dto.platform, userId: user.id },
      update: { platform: dto.platform, userId: user.id },
    });
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Body() dto: RemoveDeviceDto, @CurrentUser() user: AuthUser) {
    await this.prisma.deviceToken.deleteMany({
      where: { token: dto.token, userId: user.id },
    });
  }
}
