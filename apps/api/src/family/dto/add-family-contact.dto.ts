import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Nhân viên đăng ký người nhà được phép theo dõi ca
export class AddFamilyContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại người nhà' })
  @MaxLength(20)
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên người nhà' })
  @MaxLength(100)
  fullName!: string;
}
