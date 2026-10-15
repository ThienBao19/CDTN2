import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RemoveDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token!: string;
}
