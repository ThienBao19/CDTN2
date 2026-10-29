import { LinkExpiryService } from '../src/links/link-expiry.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  addFamily,
  api,
  createSurgery,
  createTestApp,
  familyAccess,
  linkNewFamily,
  login,
  PATIENT_NAME,
  SEED_USERS,
  TestApp,
  uniquePhone,
} from './helpers';

// Chỉ 2 trường người nhà nhập (bỏ id mà addFamily trả về)
const who = (c: { phone: string; fullName: string }) => ({
  phone: c.phone,
  fullName: c.fullName,
});

type MySurgery = {
  surgeryId: string;
  linkId: string;
  patientName: string;
  updatedAt: string;
  history?: Array<Record<string, unknown>>;
};

describe('Người nhà vào xem bằng SĐT + họ tên + tên bệnh nhân (e2e)', () => {
  let app: TestApp;
  let staff: string;

  beforeAll(async () => {
    app = await createTestApp();
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  const tryAccess = (body: Record<string, string>) =>
    api(app).post('/auth/family-access').send(body);

  const completeSurgery = async (surgeryId: string) => {
    for (const statusCode of [
      'PREPARING',
      'IN_SURGERY',
      'RECOVERING',
      'COMPLETED',
    ]) {
      await api(app, staff)
        .post(`/surgeries/${surgeryId}/status`)
        .send({ statusCode })
        .expect(201);
    }
  };

  it('staff registers a family contact and sees it in the list', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId, {
      phone: uniquePhone(),
      fullName: '  Lê   Thị Hồng ',
    });
    const res = await api(app, staff)
      .get(`/surgeries/${surgeryId}/family-contacts`)
      .expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: contact.id,
        phone: contact.phone,
        fullName: 'Lê Thị Hồng',
        status: 'ACTIVE',
      }),
    ]);
  });

  it('TC-03: family accesses with matching info and sees the surgery with a masked name', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    const res = await api(app, family).get('/my/surgeries').expect(200);
    const list = res.body as MySurgery[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ surgeryId, patientName: 'N. V. An' });
  });

  it('accepts names typed without diacritics, any case, and phone with spaces or +84', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId);
    await tryAccess({
      phone: `+84 ${contact.phone.slice(1, 4)} ${contact.phone.slice(4)}`,
      fullName: 'tran thi MAI',
      patientName: 'nguyen van an',
    }).expect(200);
  });

  it('TC-04: rejects a wrong patient name, wrong family name or unknown phone', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId);
    await tryAccess({ ...who(contact), patientName: 'Nguyễn Văn Anh' }).expect(
      401,
    );
    await tryAccess({
      ...who(contact),
      fullName: 'Người Khác',
      patientName: PATIENT_NAME,
    }).expect(401);
    const res = await tryAccess({
      phone: uniquePhone(),
      fullName: contact.fullName,
      patientName: PATIENT_NAME,
    }).expect(401);
    expect((res.body as { message: string }).message).toMatch(/chưa khớp/);
  });

  it('TC-05: locks access for a phone after 5 wrong attempts', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId);
    for (let i = 0; i < 5; i += 1) {
      await tryAccess({ ...who(contact), patientName: 'Sai Tên' }).expect(401);
    }
    await tryAccess({ ...who(contact), patientName: PATIENT_NAME }).expect(429);
  });

  it('refuses to register a phone that belongs to a staff account', async () => {
    const admin = await login(app, SEED_USERS.admin);
    const phone = uniquePhone();
    await api(app, admin)
      .post('/admin/users')
      .send({
        fullName: 'NV có SĐT',
        email: `nv${phone}@benhvien.test`,
        phone,
        password: 'NhanVien@123',
        role: 'STAFF',
      })
      .expect(201);
    const surgeryId = await createSurgery(app, staff);
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/family-contacts`)
      .send({ phone, fullName: 'Ai Đó' })
      .expect(409);
  });

  it('forbids family members from registering contacts', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await api(app, family)
      .post(`/surgeries/${surgeryId}/family-contacts`)
      .send({ phone: uniquePhone(), fullName: 'Người Lạ' })
      .expect(403);
  });

  it('TC-06: returns 404 for a surgery the family member is not registered for', async () => {
    const family = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    const other = await createSurgery(app, staff);
    await api(app, family).get(`/my/surgeries/${other}`).expect(404);
    await api(app, family).get(`/surgeries/${other}/history`).expect(404);
    await api(app, family).get(`/surgeries/${other}`).expect(403);
  });

  it('FR-08: family sees status detail and history without internal notes', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/status`)
      .send({ statusCode: 'PREPARING', note: 'Ghi chú nội bộ' })
      .expect(201);
    const res = await api(app, family)
      .get(`/my/surgeries/${surgeryId}`)
      .expect(200);
    const detail = res.body as MySurgery;
    expect(detail.history).toHaveLength(2);
    expect(JSON.stringify(detail)).not.toContain('Ghi chú nội bộ');
  });

  it('TC-08: staff removes a family contact → their access ends immediately', async () => {
    const surgeryId = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, surgeryId);
    const family = await familyAccess(app, contact);
    await api(app, staff).delete(`/links/${contact.id}`).expect(204);
    const res = await api(app, family).get('/my/surgeries').expect(401);
    expect((res.body as { message: string }).message).toMatch(
      /Phiên theo dõi đã kết thúc/,
    );
    await api(app)
      .post('/auth/family-access')
      .send({ ...who(contact), patientName: PATIENT_NAME })
      .expect(401);
  });

  it('family stops following on their own and cannot revoke others', async () => {
    const surgeryId = await createSurgery(app, staff);
    const owner = await linkNewFamily(app, staff, surgeryId);
    const other = await linkNewFamily(
      app,
      staff,
      await createSurgery(app, staff),
    );
    const [link] = (await api(app, owner).get('/my/surgeries'))
      .body as MySurgery[];
    await api(app, other).delete(`/links/${link.linkId}`).expect(404);
    await api(app, owner).delete(`/links/${link.linkId}`).expect(204);
  });

  it('one phone registered for two surgeries sees both after one access', async () => {
    const first = await createSurgery(app, staff);
    const second = await createSurgery(app, staff);
    const contact = await addFamily(app, staff, first);
    await addFamily(app, staff, second, {
      phone: contact.phone,
      fullName: contact.fullName,
    });
    const family = await familyAccess(app, contact);
    const res = await api(app, family).get('/my/surgeries').expect(200);
    expect((res.body as MySurgery[]).map((s) => s.surgeryId).sort()).toEqual(
      [first, second].sort(),
    );
  });

  it('UC-01 exception: refuses to register family for a completed surgery', async () => {
    const surgeryId = await createSurgery(app, staff);
    await completeSurgery(surgeryId);
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/family-contacts`)
      .send({ phone: uniquePhone(), fullName: 'Muộn Quá' })
      .expect(409);
  });

  it('BUG-03: access ends 24 hours after the surgery finishes', async () => {
    const prisma = app.get(PrismaService);
    const expiry = app.get(LinkExpiryService);
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await completeSurgery(surgeryId);
    await expiry.expireFinishedLinks(new Date());
    await api(app, family).get(`/my/surgeries/${surgeryId}`).expect(200);
    await expiry.expireFinishedLinks(
      new Date(Date.now() + 25 * 60 * 60 * 1000),
    );
    await api(app, family).get(`/my/surgeries/${surgeryId}`).expect(401);
    const link = await prisma.familyLink.findFirst({ where: { surgeryId } });
    expect(link?.status).toBe('REVOKED');
  });

  it('FR-11: logs a family view once even when the screen refreshes repeatedly', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    for (let i = 0; i < 3; i += 1) {
      await api(app, family).get(`/my/surgeries/${surgeryId}`).expect(200);
    }
    const views = await app.get(PrismaService).auditLog.count({
      where: { action: 'VIEW', entityId: surgeryId },
    });
    expect(views).toBe(1);
  });

  it('BUG-15: shows the last status change time, not the last edit time', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await linkNewFamily(app, staff, surgeryId);
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/status`)
      .send({ statusCode: 'PREPARING' })
      .expect(201);
    const lastChange = await app.get(PrismaService).statusHistory.findFirst({
      where: { surgeryId },
      orderBy: { changedAt: 'desc' },
    });
    await new Promise((r) => setTimeout(r, 50));
    await api(app, staff)
      .put(`/surgeries/${surgeryId}`)
      .send({ title: 'Đổi tên ca' })
      .expect(200);
    const res = await api(app, family)
      .get(`/my/surgeries/${surgeryId}`)
      .expect(200);
    expect((res.body as MySurgery).updatedAt).toBe(
      lastChange?.changedAt.toISOString(),
    );
  });
});
