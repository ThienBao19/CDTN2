import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelSurgeryDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy ca' })
  @MaxLength(500)
  reason!: string;
}
