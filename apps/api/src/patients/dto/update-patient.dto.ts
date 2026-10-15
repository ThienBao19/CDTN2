import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';

// Không cho sửa mã bệnh nhân sau khi tạo
export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['patientCode'] as const),
) {}
