import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  api,
  createTestApp,
  login,
  registerFamily,
  SEED_USERS,
  TestApp,
} from './helpers';

// Số điện thoại ngẫu nhiên để chạy lại test không bị trùng
const PHONE = `09${String(Date.now()).slice(-8)}`;

describe('Auth & phân quyền (e2e) — FR-01, FR-02', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a family account and returns no password hash', async () => {
    const res = await api(app)
      .post('/auth/register')
      .send({
        fullName: 'Trần Thị Bích',
        phone: PHONE,
        password: 'MatKhau@123',
      })
      .expect(201);
    expect(res.body).toMatchObject({ role: 'FAMILY', phone: PHONE });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('rejects registering with a duplicate phone', async () => {
    await api(app)
      .post('/auth/register')
      .send({ fullName: 'X', phone: PHONE, password: 'MatKhau@123' })
      .expect(409);
  });

  it('rejects registration with an invalid payload', async () => {
    await api(app)
      .post('/auth/register')
      .send({ fullName: '', email: 'not-an-email', password: '123' })
      .expect(400);
  });

  it('logs in with phone number and sets an httpOnly cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: PHONE, password: 'MatKhau@123' })
      .expect(200);
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cookies.join(';')).toMatch(/pt_token=.+HttpOnly/i);
  });

  it('rejects a wrong password with 401', async () => {
    await api(app)
      .post('/auth/login')
      .send({ identifier: SEED_USERS.staff, password: 'sai-mat-khau' })
      .expect(401);
  });

  it('returns 401 when calling a protected API without a token', async () => {
    await api(app).get('/my/surgeries').expect(401);
  });

  it('returns the current user from /auth/me', async () => {
    const token = await login(app, SEED_USERS.staff);
    const res = await api(app, token).get('/auth/me').expect(200);
    expect(res.body).toMatchObject({ role: 'STAFF' });
  });

  it('changes password and requires the new one to log in', async () => {
    const token = await registerFamily(app);
    const me = await api(app, token).get('/auth/me').expect(200);
    const email = (me.body as { email: string }).email;
    await api(app, token)
      .put('/auth/password')
      .send({ currentPassword: 'MatKhau@123', newPassword: 'MatKhauMoi@456' })
      .expect(200);
    await api(app)
      .post('/auth/login')
      .send({ identifier: email, password: 'MatKhau@123' })
      .expect(401);
    await login(app, email, 'MatKhauMoi@456');
  });

  it('forbids a family account from creating patients (FR-02)', async () => {
    const token = await login(app, SEED_USERS.family);
    await api(app, token)
      .post('/patients')
      .send({
        patientCode: 'BN-X',
        fullName: 'A',
        dateOfBirth: '2000-01-01',
        gender: 'MALE',
      })
      .expect(403);
  });

  it('BUG-04: changing the password revokes other sessions but keeps the current one', async () => {
    const otherSession = await registerFamily(app);
    const me = await api(app, otherSession).get('/auth/me').expect(200);
    const email = (me.body as { email: string }).email;
    const current = await login(app, email, 'MatKhau@123');
    const res = await api(app, current)
      .put('/auth/password')
      .send({ currentPassword: 'MatKhau@123', newPassword: 'MatKhauMoi@456' })
      .expect(200);
    await api(app, otherSession).get('/auth/me').expect(401);
    await api(app, current).get('/auth/me').expect(401);
    const fresh = (res.body as { accessToken: string }).accessToken;
    await api(app, fresh).get('/auth/me').expect(200);
  });

  it('BUG-08: records successful and failed logins in the audit log', async () => {
    const prisma = app.get(PrismaService);
    const before = await prisma.auditLog.count({
      where: { action: 'LOGIN_FAILED' },
    });
    await api(app)
      .post('/auth/login')
      .send({ identifier: SEED_USERS.admin, password: 'sai-mat-khau' })
      .expect(401);
    const after = await prisma.auditLog.count({
      where: { action: 'LOGIN_FAILED' },
    });
    expect(after).toBe(before + 1);
  });
});
