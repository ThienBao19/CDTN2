import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ChangeStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn trạng thái' })
  statusCode!: string;

  // Ghi chú; bắt buộc khi override (quay lui hoặc bỏ bước)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsBoolean()
  override?: boolean;
}
