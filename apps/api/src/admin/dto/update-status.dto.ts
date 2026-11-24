
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// Chỉ sửa tên hiển thị, nội dung thông báo và thời gian dự kiến;
// không đổi mã/thứ tự để giữ đúng quy trình.
export class UpdateStatusDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  notificationMessage?: string;

  // Thời gian dự kiến mặc định của giai đoạn (phút).
  // Không truyền: giữ nguyên giá trị hiện tại.
  // null: xóa thời gian dự kiến đã cấu hình.
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsInt({ message: 'Thời gian dự kiến phải là số nguyên' })
  @Min(1, { message: 'Thời gian dự kiến phải lớn hơn 0 phút' })
  @Max(2147483647, {
    message: 'Thời gian dự kiến vượt quá giới hạn cho phép',
  })
  expectedMinutes?: number | null;
}
