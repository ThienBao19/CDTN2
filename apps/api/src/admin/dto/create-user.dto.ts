import { Role } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Quản trị viên tạo tài khoản nhân viên y tế hoặc quản trị viên
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(100)
  fullName!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsOptional()
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72)
  password!: string;

  @IsIn([Role.STAFF, Role.ADMIN], {
    message: 'Vai trò phải là STAFF hoặc ADMIN',
  })
  role!: Role;
}
