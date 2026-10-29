import {
  api,
  createSurgery,
  createTestApp,
  linkNewFamily,
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
    const family = await linkNewFamily(app, staff, id);
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

  it('FR-03: searches patients by code or name and updates their profile', async () => {
    const code = 'BN-TIM-' + Date.now();
    const created = await api(app, staff)
      .post('/patients')
      .send({
        patientCode: code,
        fullName: 'Phạm Thị Lan',
        dateOfBirth: '1980-02-02',
        gender: 'FEMALE',
      })
      .expect(201);
    const id = (created.body as { id: string }).id;
    const byCode = await api(app, staff)
      .get('/patients?q=' + code.toLowerCase())
      .expect(200);
    expect((byCode.body as Array<{ id: string }>).map((p) => p.id)).toContain(
      id,
    );
    const updated = await api(app, staff)
      .put('/patients/' + id)
      .send({ fullName: 'Phạm Thị Lan Anh' })
      .expect(200);
    expect((updated.body as { fullName: string }).fullName).toBe(
      'Phạm Thị Lan Anh',
    );
    await api(app, staff)
      .get('/patients/' + id)
      .expect(200);
    await api(app, staff)
      .get('/patients/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('FR-04: filters surgeries by day in Vietnam time', async () => {
    const id = await createSurgery(app, staff);
    // 23:30 giờ VN ngày 20/10 = 16:30 UTC; phải nằm trong ngày 20/10 chứ không phải 21/10
    await api(app, staff)
      .put('/surgeries/' + id)
      .send({ scheduledAt: '2030-10-20T16:30:00.000Z' })
      .expect(200);
    const sameDay = await api(app, staff)
      .get('/surgeries?date=2030-10-20')
      .expect(200);
    const nextDay = await api(app, staff)
      .get('/surgeries?date=2030-10-21')
      .expect(200);
    expect((sameDay.body as Array<{ id: string }>).map((x) => x.id)).toContain(
      id,
    );
    expect(
      (nextDay.body as Array<{ id: string }>).map((x) => x.id),
    ).not.toContain(id);
  });
});
