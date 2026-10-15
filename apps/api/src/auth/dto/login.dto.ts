import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // Email hoặc số điện thoại
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email hoặc số điện thoại' })
  @MaxLength(100)
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MaxLength(72)
  password!: string;
}
