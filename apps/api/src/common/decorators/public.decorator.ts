import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Bỏ qua kiểm tra đăng nhập cho endpoint công khai
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
