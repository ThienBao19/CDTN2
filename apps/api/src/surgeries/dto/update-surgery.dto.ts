
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';
import { CreateSurgeryDto } from './create-surgery.dto';

export class UpdateSurgeryDto extends PartialType(
  OmitType(CreateSurgeryDto, ['patientId'] as const),
) {
  // Thời gian dự kiến riêng của ca phẫu thuật (phút).
  // Không truyền: giữ nguyên giá trị hiện tại.
  // null: sử dụng thời gian mặc định do Admin cấu hình.
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsInt({ message: 'Thời gian dự kiến phải là số nguyên' })
  @Min(1, { message: 'Thời gian dự kiến phải lớn hơn 0 phút' })
  @Max(2147483647, {
    message: 'Thời gian dự kiến vượt quá giới hạn cho phép',
  })
  expectedMinutes?: number | null;
}
