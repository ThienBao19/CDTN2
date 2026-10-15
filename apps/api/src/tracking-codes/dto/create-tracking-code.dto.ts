import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateTrackingCodeDto {
  // Thời hạn hiệu lực tính bằng giờ (mặc định 24 giờ)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(72)
  ttlHours?: number;
}
