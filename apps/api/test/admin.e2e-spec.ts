import {
  api,
  createSurgery,
  createTestApp,
  linkNewFamily,
  login,
  SEED_USERS,
  TestApp,
} from './helpers';

type User = { id: string; role: string; status?: string };

describe('Quản trị (e2e) — FR-11, FR-12', () => {
  let app: TestApp;
  let admin: string;
  let staff: string;

  beforeAll(async () => {
    app = await createTestApp();
    admin = await login(app, SEED_USERS.admin);
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('forbids staff and family from admin APIs', async () => {
    for (const path of [
      '/admin/users',
      '/admin/rooms',
      '/admin/statuses',
      '/admin/audit-logs',
    ]) {
      await api(app, staff).get(path).expect(403);
    }
  });

  it('creates a staff account that can log in', async () => {
    const email = `nv${Date.now()}@example.com`;
    await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'Nhân viên mới',
        email,
        password: 'NhanVien@123',
        role: 'STAFF',
      })
      .expect(201);
    const token = await login(app, email, 'NhanVien@123');
    const me = await api(app, token).get('/auth/me').expect(200);
    expect((me.body as User).role).toBe('STAFF');
  });

  it('rejects creating FAMILY accounts from the admin page', async () => {
    await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'X',
        email: `x${Date.now()}@example.com`,
        password: 'MatKhau@123',
        role: 'FAMILY',
      })
      .expect(400);
  });

  it('locks an account: existing token stops working and login is refused', async () => {
    const email = `khoa${Date.now()}@example.com`;
    const created = await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'Sẽ bị khóa',
        email,
        password: 'NhanVien@123',
        role: 'STAFF',
      })
      .expect(201);
    const token = await login(app, email, 'NhanVien@123');
    await api(app, admin)
      .patch(`/admin/users/${(created.body as User).id}`)
      .send({ status: 'LOCKED' })
      .expect(200);
    await api(app, token).get('/auth/me').expect(401);
    await api(app)
      .post('/auth/login')
      .send({ identifier: email, password: 'NhanVien@123' })
      .expect(403);
  });

  it('does not allow an admin to lock themselves', async () => {
    const me = await api(app, admin).get('/auth/me').expect(200);
    await api(app, admin)
      .patch(`/admin/users/${(me.body as User).id}`)
      .send({ status: 'LOCKED' })
      .expect(400);
  });

  it('creates rooms and rejects duplicate names', async () => {
    const name = `Phòng mổ ${Date.now()}`;
    await api(app, admin)
      .post('/admin/rooms')
      .send({ name, type: 'OPERATING' })
      .expect(201);
    await api(app, admin)
      .post('/admin/rooms')
      .send({ name, type: 'OPERATING' })
      .expect(409);
  });

  it('uses the updated notification message from the status catalog', async () => {
    const statuses = (await api(app, admin).get('/admin/statuses').expect(200))
      .body as Array<{
      id: number;
      code: string;
      notificationMessage: string;
    }>;
    const preparing = statuses.find((s) => s.code === 'PREPARING');
    if (!preparing) throw new Error('Thiếu trạng thái PREPARING');
    const message = `Đang chuẩn bị (sửa ${Date.now()})`;
    await api(app, admin)
      .put(`/admin/statuses/${preparing.id}`)
      .send({ notificationMessage: message })
      .expect(200);
    try {
      const surgeryId = await createSurgery(app, staff);
      const family = await linkNewFamily(app, staff, surgeryId);
      await api(app, staff)
        .post(`/surgeries/${surgeryId}/status`)
        .send({ statusCode: 'PREPARING' })
        .expect(201);
      const res = await api(app, family).get('/my/notifications').expect(200);
      expect(
        (res.body as { items: Array<{ content: string }> }).items[0].content,
      ).toBe(message);
    } finally {
      await api(app, admin)
        .put(`/admin/statuses/${preparing.id}`)
        .send({ notificationMessage: preparing.notificationMessage })
        .expect(200);
    }
  });

  it('lists audit logs filtered by action with pagination', async () => {
    const surgeryId = await createSurgery(app, staff);
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/status`)
      .send({ statusCode: 'PREPARING' })
      .expect(201);
    const res = await api(app, admin)
      .get('/admin/audit-logs?action=STATUS_CHANGE&pageSize=5')
      .expect(200);
    const body = res.body as {
      items: Array<{ action: string; user: { fullName: string } }>;
      total: number;
    };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect(body.items.every((i) => i.action === 'STATUS_CHANGE')).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(body.items.length);
  });

  it('updates a room, deactivates it and returns 404 for unknown ids', async () => {
    const created = await api(app, admin)
      .post('/admin/rooms')
      .send({ name: 'Phòng tạm ' + Date.now(), type: 'WAITING' })
      .expect(201);
    const id = (created.body as { id: string }).id;
    const updated = await api(app, admin)
      .put('/admin/rooms/' + id)
      .send({ isActive: false, location: 'Tầng 1' })
      .expect(200);
    expect(updated.body).toMatchObject({ isActive: false, location: 'Tầng 1' });
    const active = await api(app, staff).get('/rooms').expect(200);
    expect(
      (active.body as Array<{ id: string }>).map((r) => r.id),
    ).not.toContain(id);
    await api(app, admin)
      .put('/admin/rooms/00000000-0000-4000-8000-000000000000')
      .send({ isActive: true })
      .expect(404);
    await api(app, admin)
      .put('/admin/statuses/999999')
      .send({ label: 'X' })
      .expect(404);
  });

  it('BUG-04: changing a user role revokes their open sessions', async () => {
    const email = 'vaitro' + Date.now() + '@example.com';
    const created = await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'Đổi vai trò',
        email,
        password: 'NhanVien@123',
        role: 'STAFF',
      })
      .expect(201);
    const token = await login(app, email, 'NhanVien@123');
    await api(app, admin)
      .patch('/admin/users/' + (created.body as User).id)
      .send({ role: 'ADMIN' })
      .expect(200);
    await api(app, token).get('/auth/me').expect(401);
  });
});
