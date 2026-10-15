import { IsOptional, IsUUID } from 'class-validator';

export class ListLinksDto {
  // Quản trị viên lọc theo ca
  @IsOptional()
  @IsUUID('4')
  surgeryId?: string;
}
