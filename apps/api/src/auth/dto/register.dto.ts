import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(100)
  fullName!: string;

  // Bắt buộc có email hoặc số điện thoại
  @ValidateIf((o: RegisterDto) => !o.phone || o.email !== undefined)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72)
  password!: string;
}
