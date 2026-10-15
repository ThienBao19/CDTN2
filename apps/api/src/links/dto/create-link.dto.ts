import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã theo dõi' })
  @MaxLength(20)
  code!: string;
}
