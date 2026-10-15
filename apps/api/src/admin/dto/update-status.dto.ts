import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Chỉ sửa tên hiển thị và nội dung thông báo; không đổi mã/thứ tự để giữ đúng quy trình
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
}
