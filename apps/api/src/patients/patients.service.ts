import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

const SEARCH_LIMIT = 50;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreatePatientDto, user: AuthUser): Promise<Patient> {
    const patientCode = dto.patientCode.toUpperCase();
    const exists = await this.prisma.patient.findUnique({
      where: { patientCode },
    });
    if (exists) throw new ConflictException('Mã bệnh nhân đã tồn tại');

    const patient = await this.prisma.patient.create({
      data: {
        patientCode,
        fullName: dto.fullName.trim(),
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
      },
    });
    await this.audit.log({
      userId: user.id,
      action: 'CREATE',
      entityType: 'patient',
      entityId: patient.id,
    });
    return patient;
  }

  // Tìm theo mã hoặc tên — chỉ dành cho nhân viên/quản trị (BR-03)
  search(query?: string): Promise<Patient[]> {
    const term = query?.trim();
    const where: Prisma.PatientWhereInput = term
      ? {
          OR: [
            { patientCode: { contains: term, mode: 'insensitive' } },
            { fullName: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: SEARCH_LIMIT,
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');
    return patient;
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    user: AuthUser,
  ): Promise<Patient> {
    await this.findOne(id);
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
      },
    });
    await this.audit.log({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'patient',
      entityId: id,
    });
    return patient;
  }
}
