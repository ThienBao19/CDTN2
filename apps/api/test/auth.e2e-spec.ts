import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  addFamily,
  api,
  createSurgery,
  createTestApp,
  linkNewFamily,
  login,
  SEED_USERS,
  TestApp,
} from './helpers';

describe('Đăng nhập nhân viên/quản trị (e2e) — FR-01, FR-02', () => {
  let app: TestApp;
  let staff: string;

  beforeAll(async () => {
    app = await createTestApp();
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('seeds 3 staff accounts that can all log in', async () => {
    for (const email of [
      SEED_USERS.staff,
      SEED_USERS.staff2,
      SEED_USERS.staff3,
    ]) {
      const token = await login(app, email);
      const me = await api(app, token).get('/auth/me').expect(200);
      expect(me.body).toMatchObject({ role: 'STAFF', email });
    }
  });

  it('logs in staff and sets an httpOnly cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identifier: SEED_USERS.staff,
        password: process.env.SEED_PASSWORD,
      })
      .expect(200);
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cookies.join(';')).toMatch(/pt_token=.+HttpOnly/i);
  });

  it('no longer offers public self-registration', async () => {
    await api(app)
      .post('/auth/register')
      .send({ fullName: 'X', phone: '0912345678', password: 'MatKhau@123' })
      .expect(404);
  });

  it('rejects a wrong password with 401', async () => {
    await api(app)
      .post('/auth/login')
      .send({ identifier: SEED_USERS.staff, password: 'sai-mat-khau' })
      .expect(401);
  });

  it('does not let a family member use password login', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId);
    await api(app)
      .post('/auth/login')
      .send({ identifier: contact.phone, password: 'bat-ky' })
      .expect(401);
  });

  it('returns 401 when calling a protected API without a token', async () => {
    await api(app).get('/my/surgeries').expect(401);
  });

  it('forbids a family member from staff APIs and password change (FR-02)', async () => {
    const family = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    await api(app, family)
      .post('/patients')
      .send({
        patientCode: 'BN-X',
        fullName: 'A',
        dateOfBirth: '2000-01-01',
        gender: 'MALE',
      })
      .expect(403);
    await api(app, family)
      .put('/auth/password')
      .send({ currentPassword: 'x', newPassword: 'MatKhauMoi@456' })
      .expect(403);
  });

  it('BUG-04: changing the password revokes other logins but returns a fresh token', async () => {
    const admin = await login(app, SEED_USERS.admin);
    const email = `doimk${Date.now()}@benhvien.test`;
    await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'Đổi mật khẩu',
        email,
        password: 'NhanVien@123',
        role: 'STAFF',
      })
      .expect(201);
    const other = await login(app, email, 'NhanVien@123');
    const current = await login(app, email, 'NhanVien@123');
    const res = await api(app, current)
      .put('/auth/password')
      .send({ currentPassword: 'NhanVien@123', newPassword: 'MatKhauMoi@456' })
      .expect(200);
    await api(app, other).get('/auth/me').expect(401);
    const fresh = (res.body as { accessToken: string }).accessToken;
    await api(app, fresh).get('/auth/me').expect(200);
    await login(app, email, 'MatKhauMoi@456');
  });

  it('BUG-08: records failed logins in the audit log', async () => {
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
