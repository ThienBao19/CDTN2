import { Controller, Get, Query, Res } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatsExportDto, StatsQueryDto } from '../dto/stats-query.dto';
import { AdminStatsService } from './admin-stats.service';

// Dashboard thống kê cho quản trị viên; lọc theo khoảng ngày (giờ VN), mặc định 30 ngày
@Controller('admin/stats')
@Roles(Role.ADMIN)
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('surgeries')
  surgeries(@Query() q: StatsQueryDto) {
    return this.stats.surgeries(this.stats.range(q.from, q.to));
  }

  @Get('stage-durations')
  stageDurations(@Query() q: StatsQueryDto) {
    return this.stats.stageDurations(this.stats.range(q.from, q.to));
  }

  @Get('notifications')
  notifications(@Query() q: StatsQueryDto) {
    return this.stats.notifications(this.stats.range(q.from, q.to));
  }

  @Get('export')
  async export(
    @Query() q: StatsExportDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const r = this.stats.range(q.from, q.to);
    const type = q.type ?? 'surgeries';
    const csv = await this.stats.exportCsv(r, type);
    const name = `thong-ke-${type === 'summary' ? 'tong-hop' : 'ca'}_${r.from}_${r.to}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    return csv;
  }
}
