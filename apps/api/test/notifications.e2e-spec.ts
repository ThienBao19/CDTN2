import { DeliveryStatus } from '@prisma/client';
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
  waitFor,
} from './helpers';

type NotificationList = {
  items: Array<{ id: string; content: string; readAt: string | null }>;
  unreadCount: number;
};

describe('Thông báo (e2e) — FR-09, BR-05, TC-09', () => {
  let app: TestApp;
  let staff: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    staff = await login(app, SEED_USERS.staff);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const changeStatus = (id: string, statusCode: string) =>
    api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode })
      .expect(201);

  it('TC-01: creates a discreet notification for linked family on status change', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await changeStatus(surgeryId, 'PREPARING');
    const res = await api(app, family).get('/my/notifications').expect(200);
    const body = res.body as NotificationList;
    expect(body.unreadCount).toBe(1);
    expect(body.items[0].content).toBe(
      'Bệnh nhân đang được chuẩn bị trước phẫu thuật.',
    );
    expect(body.items[0].content).not.toContain('Nguyễn');
  });

  it('records delivery as SKIPPED when FCM is not configured', async () => {
    const surgeryId = await createSurgery(app, staff);
    await linkNewFamily(app, staff, surgeryId);
    await changeStatus(surgeryId, 'PREPARING');
    await waitFor(async () => {
      const n = await prisma.notification.findFirst({ where: { surgeryId } });
      return n?.status === DeliveryStatus.SKIPPED;
    });
  });

  it('BR-05: does not notify unlinked or revoked family members', async () => {
    const surgeryId = await createSurgery(app, staff);
    const revoked = await addFamily(app, staff, surgeryId);
    await api(app, staff).delete(`/links/${revoked.id}`).expect(204);
    // Người lạ: được đăng ký cho một ca khác
    const stranger = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    await changeStatus(surgeryId, 'PREPARING');
    const res = await api(app, stranger).get('/my/notifications').expect(200);
    expect((res.body as NotificationList).items).toHaveLength(0);
    // Người đã bị gỡ không còn liên kết nên không có thông báo nào cho ca này
    expect(await prisma.notification.count({ where: { surgeryId } })).toBe(0);
  });

  it('notifies when the schedule changes but not when only the title changes', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await api(app, staff)
      .put(`/surgeries/${surgeryId}`)
      .send({ title: 'Tên mới' })
      .expect(200);
    await api(app, staff)
      .put(`/surgeries/${surgeryId}`)
      .send({ scheduledAt: new Date(Date.now() + 7200e3).toISOString() })
      .expect(200);
    const res = await api(app, family).get('/my/notifications').expect(200);
    const items = (res.body as NotificationList).items;
    expect(items).toHaveLength(1);
    expect(items[0].content).toMatch(/Lịch phẫu thuật có thay đổi/);
  });

  it('TC-09: notifications stay available to read after being offline', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await changeStatus(surgeryId, 'PREPARING');
    await changeStatus(surgeryId, 'IN_SURGERY');
    const res = await api(app, family).get('/my/notifications').expect(200);
    const body = res.body as NotificationList;
    expect(body.unreadCount).toBe(2);
    await api(app, family)
      .post(`/my/notifications/${body.items[0].id}/read`)
      .expect(204);
    await api(app, family).post('/my/notifications/read-all').expect(204);
    const after = await api(app, family).get('/my/notifications').expect(200);
    expect((after.body as NotificationList).unreadCount).toBe(0);
  });

  it('registers and removes a device token for push', async () => {
    const family = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    const token = `test-token-${Date.now()}`;
    await api(app, family)
      .post('/devices')
      .send({ token, platform: 'WEB' })
      .expect(204);
    expect(await prisma.deviceToken.count({ where: { token } })).toBe(1);
    await api(app, family).delete('/devices').send({ token }).expect(204);
    expect(await prisma.deviceToken.count({ where: { token } })).toBe(0);
  });

  it('TC-55: moves the device token to the family member now using the phone', async () => {
    const token = `shared-phone-${Date.now()}`;
    const first = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    await api(app, first)
      .post('/devices')
      .send({ token, platform: 'WEB' })
      .expect(204);
    const surgeryId = await createSurgery(app, staff);
    const second = await linkNewFamily(app, staff, surgeryId);
    // Người thứ hai mở app trên cùng điện thoại: app đăng ký lại token
    await api(app, second)
      .post('/devices')
      .send({ token, platform: 'WEB' })
      .expect(204);
    const me = await api(app, second).get('/auth/me').expect(200);
    const device = await prisma.deviceToken.findUnique({ where: { token } });
    expect(device?.userId).toBe((me.body as { id: string }).id);
    expect(await prisma.deviceToken.count({ where: { token } })).toBe(1);
  });

  it('forbids staff from registering family devices', async () => {
    await api(app, staff)
      .post('/devices')
      .send({ token: 'x', platform: 'WEB' })
      .expect(403);
  });
});
