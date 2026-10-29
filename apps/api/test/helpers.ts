import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export type TestApp = INestApplication<App>;

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

export const SEED_USERS = {
  admin: 'admin@benhvien.test',
  staff: 'nhanvien1@benhvien.test',
  staff2: 'nhanvien2@benhvien.test',
  staff3: 'nhanvien3@benhvien.test',
} as const;

export function seedPassword(): string {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error('Thiếu SEED_PASSWORD');
  return password;
}

export async function login(
  app: TestApp,
  identifier: string,
  password = seedPassword(),
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ identifier, password })
    .expect(200);
  return (res.body as { accessToken: string }).accessToken;
}

let counter = 0;

// Số điện thoại không trùng giữa các lần chạy test
export function uniquePhone(): string {
  counter += 1;
  const tail = String(counter % 100).padStart(2, '0');
  return `09${String(Date.now()).slice(-6)}${tail}`;
}

export const PATIENT_NAME = 'Nguyễn Văn An';

export function api(app: TestApp, token?: string) {
  const server = app.getHttpServer();
  const withAuth = (req: request.Test) =>
    token ? req.set('Authorization', `Bearer ${token}`) : req;
  return {
    get: (url: string) => withAuth(request(server).get(`/api${url}`)),
    post: (url: string) => withAuth(request(server).post(`/api${url}`)),
    put: (url: string) => withAuth(request(server).put(`/api${url}`)),
    patch: (url: string) => withAuth(request(server).patch(`/api${url}`)),
    delete: (url: string) => withAuth(request(server).delete(`/api${url}`)),
  };
}

// Tạo bệnh nhân + ca phẫu thuật mới, trả về id ca
export async function createSurgery(
  app: TestApp,
  staffToken: string,
): Promise<string> {
  counter += 1;
  const patient = await api(app, staffToken)
    .post('/patients')
    .send({
      patientCode: `BN${Date.now()}${counter}`.slice(0, 20),
      fullName: 'Nguyễn Văn An',
      dateOfBirth: '1960-05-12',
      gender: 'MALE',
    })
    .expect(201);
  const surgery = await api(app, staffToken)
    .post('/surgeries')
    .send({
      patientId: (patient.body as { id: string }).id,
      title: 'Phẫu thuật nội soi',
      scheduledAt: new Date().toISOString(),
    })
    .expect(201);
  return (surgery.body as { id: string }).id;
}

export type FamilyContact = { phone: string; fullName: string };

// Nhân viên đăng ký người nhà cho ca (thay cho cấp mã/QR)
export async function addFamily(
  app: TestApp,
  staffToken: string,
  surgeryId: string,
  contact: FamilyContact = { phone: uniquePhone(), fullName: 'Trần Thị Mai' },
): Promise<FamilyContact & { id: string }> {
  const res = await api(app, staffToken)
    .post(`/surgeries/${surgeryId}/family-contacts`)
    .send(contact)
    .expect(201);
  return { ...contact, id: (res.body as { id: string }).id };
}

// Người nhà vào xem bằng SĐT + họ tên + tên bệnh nhân, trả về token phiên
export async function familyAccess(
  app: TestApp,
  contact: FamilyContact,
  patientName = PATIENT_NAME,
): Promise<string> {
  const res = await api(app)
    .post('/auth/family-access')
    .send({ phone: contact.phone, fullName: contact.fullName, patientName })
    .expect(200);
  return (res.body as { accessToken: string }).accessToken;
}

// Đăng ký người nhà mới cho ca rồi vào xem, trả về token phiên của người nhà
export async function linkNewFamily(
  app: TestApp,
  staffToken: string,
  surgeryId: string,
): Promise<string> {
  const contact = await addFamily(app, staffToken, surgeryId);
  return familyAccess(app, contact);
}

// Chờ tới khi điều kiện đúng (dùng cho việc gửi push chạy nền)
export async function waitFor(
  check: () => Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();
  while (!(await check())) {
    if (Date.now() - start > timeoutMs)
      throw new Error('waitFor: hết thời gian chờ');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
