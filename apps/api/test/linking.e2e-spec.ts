import { PrismaService } from '../src/prisma/prisma.service';
import {
  api,
  createSurgery,
  createTestApp,
  issueCode,
  login,
  registerFamily,
  SEED_USERS,
  TestApp,
} from './helpers';

type MySurgery = {
  surgeryId: string;
  linkId: string;
  patientName: string;
  history?: Array<Record<string, unknown>>;
};

describe('Mã theo dõi & liên kết người nhà (e2e) — FR-06, FR-07, FR-08, FR-13', () => {
  let app: TestApp;
  let staff: string;

  beforeAll(async () => {
    app = await createTestApp();
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('UC-01: issues a code in XXXX-XXXX format and lists it without the code', async () => {
    const surgeryId = await createSurgery(app, staff);
    const issued = await issueCode(app, staff, surgeryId);
    expect(issued.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const list = await api(app, staff)
      .get(`/surgeries/${surgeryId}/tracking-codes`)
      .expect(200);
    expect(list.body).toEqual([
      expect.objectContaining({ id: issued.id, status: 'PENDING' }),
    ]);
    expect(JSON.stringify(list.body)).not.toContain(issued.code);
  });

  it('TC-03: links with a valid code and sees the surgery with a masked name', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { code } = await issueCode(app, staff, surgeryId);
    const family = await registerFamily(app);
    await api(app, family)
      .post('/links')
      .send({ code: code.toLowerCase() })
      .expect(201);
    const res = await api(app, family).get('/my/surgeries').expect(200);
    const list = res.body as MySurgery[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ surgeryId, patientName: 'N. V. An' });
  });

  it('TC-04: rejects a code that was already used', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { code } = await issueCode(app, staff, surgeryId);
    await api(app, await registerFamily(app))
      .post('/links')
      .send({ code })
      .expect(201);
    await api(app, await registerFamily(app))
      .post('/links')
      .send({ code })
      .expect(400);
  });

  it('TC-04: rejects a revoked code', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { id, code } = await issueCode(app, staff, surgeryId);
    await api(app, staff).delete(`/tracking-codes/${id}`).expect(204);
    const res = await api(app, await registerFamily(app))
      .post('/links')
      .send({ code })
      .expect(400);
    expect((res.body as { message: string }).message).toMatch(
      /không còn hiệu lực/,
    );
  });

  it('TC-04: rejects an expired code', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { id, code } = await issueCode(app, staff, surgeryId);
    await app.get(PrismaService).trackingCode.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await api(app, await registerFamily(app))
      .post('/links')
      .send({ code })
      .expect(400);
    expect((res.body as { message: string }).message).toMatch(/hết hạn/);
  });

  it('TC-05: locks code entry after 5 wrong attempts', async () => {
    const family = await registerFamily(app);
    for (let i = 0; i < 5; i += 1) {
      await api(app, family)
        .post('/links')
        .send({ code: 'AAAA-AAAA' })
        .expect(400);
    }
    await api(app, family)
      .post('/links')
      .send({ code: 'AAAA-AAAA' })
      .expect(429);
  });

  it('TC-06: returns 404 for a surgery the family member is not linked to', async () => {
    const surgeryId = await createSurgery(app, staff);
    const family = await registerFamily(app);
    await api(app, family).get(`/my/surgeries/${surgeryId}`).expect(404);
    await api(app, family).get(`/surgeries/${surgeryId}/history`).expect(404);
    await api(app, family).get(`/surgeries/${surgeryId}`).expect(403);
  });

  it('FR-08: linked family sees status detail and history without notes', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { code } = await issueCode(app, staff, surgeryId);
    const family = await registerFamily(app);
    await api(app, family).post('/links').send({ code }).expect(201);
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

  it('TC-08: after unlinking the family member can no longer view the surgery', async () => {
    const surgeryId = await createSurgery(app, staff);
    const { code } = await issueCode(app, staff, surgeryId);
    const family = await registerFamily(app);
    await api(app, family).post('/links').send({ code }).expect(201);
    const [link] = (await api(app, family).get('/my/surgeries'))
      .body as MySurgery[];
    await api(app, family).delete(`/links/${link.linkId}`).expect(204);
    await api(app, family).get(`/my/surgeries/${surgeryId}`).expect(404);
  });

  it("does not let a family member revoke someone else's link", async () => {
    const surgeryId = await createSurgery(app, staff);
    const { code } = await issueCode(app, staff, surgeryId);
    const owner = await registerFamily(app);
    await api(app, owner).post('/links').send({ code }).expect(201);
    const [link] = (await api(app, owner).get('/my/surgeries'))
      .body as MySurgery[];
    const other = await registerFamily(app);
    await api(app, other).delete(`/links/${link.linkId}`).expect(404);
  });

  it('UC-01 exception: refuses to issue a code for a completed surgery', async () => {
    const surgeryId = await createSurgery(app, staff);
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
    await api(app, staff)
      .post(`/surgeries/${surgeryId}/tracking-codes`)
      .send({})
      .expect(409);
  });
});
