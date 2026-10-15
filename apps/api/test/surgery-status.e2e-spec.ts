import {
  api,
  createSurgery,
  createTestApp,
  login,
  SEED_USERS,
  TestApp,
} from './helpers';

type SurgeryBody = { currentStatus: { code: string } };
type HistoryBody = Array<{ status: { code: string }; isOverride: boolean }>;

describe('Ca phẫu thuật & trạng thái (e2e) — FR-03, FR-04, FR-05, FR-10', () => {
  let app: TestApp;
  let staff: string;

  beforeAll(async () => {
    app = await createTestApp();
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a surgery at the first status with one history entry', async () => {
    const id = await createSurgery(app, staff);
    const surgery = await api(app, staff).get(`/surgeries/${id}`).expect(200);
    expect((surgery.body as SurgeryBody).currentStatus.code).toBe('RECEIVED');
    const history = await api(app, staff)
      .get(`/surgeries/${id}/history`)
      .expect(200);
    expect(history.body).toHaveLength(1);
  });

  it('TC-01: moves to the next status and records history', async () => {
    const id = await createSurgery(app, staff);
    const res = await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'PREPARING' })
      .expect(201);
    expect((res.body as SurgeryBody).currentStatus.code).toBe('PREPARING');
    const history = await api(app, staff)
      .get(`/surgeries/${id}/history`)
      .expect(200);
    const codes = (history.body as HistoryBody).map((h) => h.status.code);
    expect(codes).toEqual(['RECEIVED', 'PREPARING']);
  });

  it('TC-02: rejects skipping a status with a clear error', async () => {
    const id = await createSurgery(app, staff);
    const res = await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'IN_SURGERY' })
      .expect(400);
    expect((res.body as { message: string }).message).toMatch(/kế tiếp/);
  });

  it('allows an override only with a reason and flags it in history', async () => {
    const id = await createSurgery(app, staff);
    await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'IN_SURGERY', override: true })
      .expect(400);
    await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'IN_SURGERY', override: true, note: 'Ca cấp cứu' })
      .expect(201);
    const history = await api(app, staff)
      .get(`/surgeries/${id}/history`)
      .expect(200);
    expect((history.body as HistoryBody)[1].isOverride).toBe(true);
  });

  it('goes through all 5 statuses in order', async () => {
    const id = await createSurgery(app, staff);
    for (const code of ['PREPARING', 'IN_SURGERY', 'RECOVERING', 'COMPLETED']) {
      await api(app, staff)
        .post(`/surgeries/${id}/status`)
        .send({ statusCode: code })
        .expect(201);
    }
    const history = await api(app, staff)
      .get(`/surgeries/${id}/history`)
      .expect(200);
    expect(history.body).toHaveLength(5);
  });

  it('TC-07: forbids family and admin from updating status', async () => {
    const id = await createSurgery(app, staff);
    const family = await login(app, SEED_USERS.family);
    const admin = await login(app, SEED_USERS.admin);
    for (const token of [family, admin]) {
      await api(app, token)
        .post(`/surgeries/${id}/status`)
        .send({ statusCode: 'PREPARING' })
        .expect(403);
    }
  });

  it('rejects status changes on a cancelled surgery', async () => {
    const id = await createSurgery(app, staff);
    await api(app, staff)
      .post(`/surgeries/${id}/cancel`)
      .send({ reason: 'Bệnh nhân chưa đủ điều kiện' })
      .expect(201);
    await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'PREPARING' })
      .expect(409);
  });

  it('filters surgeries by status', async () => {
    const id = await createSurgery(app, staff);
    await api(app, staff)
      .post(`/surgeries/${id}/status`)
      .send({ statusCode: 'PREPARING' })
      .expect(201);
    const res = await api(app, staff)
      .get('/surgeries?status=PREPARING')
      .expect(200);
    const list = res.body as Array<SurgeryBody & { id: string }>;
    expect(list.some((s) => s.id === id)).toBe(true);
    expect(list.every((s) => s.currentStatus.code === 'PREPARING')).toBe(true);
  });

  it('rejects a duplicate patient code with 409', async () => {
    const body = {
      patientCode: `BN-${Date.now()}`,
      fullName: 'Lê Văn C',
      dateOfBirth: '1970-01-01',
      gender: 'MALE',
    };
    await api(app, staff).post('/patients').send(body).expect(201);
    await api(app, staff).post('/patients').send(body).expect(409);
  });
});
