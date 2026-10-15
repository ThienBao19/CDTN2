import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePatientDto {
  @Matches(/^[A-Za-z0-9-]{3,20}$/, {
    message: 'Mã bệnh nhân gồm 3-20 ký tự chữ, số hoặc dấu gạch ngang',
  })
  patientCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên bệnh nhân' })
  @MaxLength(100)
  fullName!: string;

  @IsDateString({}, { message: 'Ngày sinh không hợp lệ (YYYY-MM-DD)' })
  dateOfBirth!: string;

  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender!: Gender;
}
