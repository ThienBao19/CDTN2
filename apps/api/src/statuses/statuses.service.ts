import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusDefinition } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const SURGERY_WORKFLOW = 'SURGERY';

// Danh mục trạng thái lưu trong CSDL (mục 9.2), không cố định trong mã
@Injectable()
export class StatusesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<StatusDefinition[]> {
    return this.prisma.statusDefinition.findMany({
      where: { workflow: SURGERY_WORKFLOW, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async first(): Promise<StatusDefinition> {
    const [first] = await this.list();
    if (!first)
      throw new NotFoundException('Chưa cấu hình danh mục trạng thái');
    return first;
  }

  async findByCode(code: string): Promise<StatusDefinition> {
    const status = await this.prisma.statusDefinition.findUnique({
      where: { workflow_code: { workflow: SURGERY_WORKFLOW, code } },
    });
    if (!status || !status.isActive) {
      throw new NotFoundException(`Không có trạng thái ${code}`);
    }
    return status;
  }

  // Trạng thái cuối cùng (ví dụ "Đã hoàn tất")
  async isFinal(status: StatusDefinition): Promise<boolean> {
    const later = await this.prisma.statusDefinition.count({
      where: {
        workflow: status.workflow,
        isActive: true,
        sortOrder: { gt: status.sortOrder },
      },
    });
    return later === 0;
  }
}
