import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class ListSurgeriesDto {
  // Ngày theo giờ Việt Nam, định dạng YYYY-MM-DD
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày phải có dạng YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
