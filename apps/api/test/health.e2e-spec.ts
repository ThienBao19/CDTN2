import { api, createTestApp, TestApp } from './helpers';

describe('GET /api/health (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns database status ok without login', async () => {
    const res = await api(app).get('/health').expect(200);
    expect((res.body as { database: string }).database).toBe('up');
  });
});
