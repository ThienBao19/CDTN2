import { IsIn, IsOptional, Matches } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Khoảng ngày theo giờ Việt Nam, dạng YYYY-MM-DD (bao gồm cả hai đầu)
export class StatsQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;
}

export class StatsExportDto extends StatsQueryDto {
  // surgeries: từng ca; summary: số liệu tổng hợp của dashboard
  @IsOptional()
  @IsIn(['surgeries', 'summary'])
  type?: 'surgeries' | 'summary';
}
