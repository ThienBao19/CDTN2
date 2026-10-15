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
  admin: 'admin@example.com',
  staff: 'staff@example.com',
  family: 'family@example.com',
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

// Tạo tài khoản người nhà mới để các kịch bản không ảnh hưởng nhau
export async function registerFamily(app: TestApp): Promise<string> {
  counter += 1;
  const email = `family${Date.now()}${counter}@example.com`;
  const password = 'MatKhau@123';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ fullName: 'Người nhà test', email, password })
    .expect(201);
  return login(app, email, password);
}

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

export async function issueCode(
  app: TestApp,
  staffToken: string,
  surgeryId: string,
): Promise<{ id: string; code: string }> {
  const res = await api(app, staffToken)
    .post(`/surgeries/${surgeryId}/tracking-codes`)
    .send({})
    .expect(201);
  return res.body as { id: string; code: string };
}

// Tạo người nhà mới và liên kết với ca bằng mã do nhân viên cấp
export async function linkNewFamily(
  app: TestApp,
  staffToken: string,
  surgeryId: string,
): Promise<string> {
  const { code } = await issueCode(app, staffToken, surgeryId);
  const family = await registerFamily(app);
  await api(app, family).post('/links').send({ code }).expect(201);
  return family;
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
