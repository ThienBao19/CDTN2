import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Người nhà vào xem: số điện thoại + họ tên mình + tên bệnh nhân (không mật khẩu, không email)
export class FamilyAccessDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  @MaxLength(20)
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên của bạn' })
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên bệnh nhân' })
  @MaxLength(100)
  patientName!: string;
}
