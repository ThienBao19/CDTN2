import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSurgeryDto {
  @IsUUID('4', { message: 'Bệnh nhân không hợp lệ' })
  patientId!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Phòng không hợp lệ' })
  roomId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên ca' })
  @MaxLength(150)
  title!: string;

  @IsDateString({}, { message: 'Giờ dự kiến không hợp lệ' })
  scheduledAt!: string;
}
