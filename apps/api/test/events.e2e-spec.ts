import { request as httpRequest, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  api,
  createSurgery,
  createTestApp,
  linkNewFamily,
  login,
  registerFamily,
  SEED_USERS,
  TestApp,
} from './helpers';

type Stream = { received: () => string; close: () => void };

function openStream(port: number, token: string): Promise<Stream> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const req = httpRequest(
      {
        port,
        path: '/api/events',
        headers: { Authorization: `Bearer ${token}` },
      },
      (res: IncomingMessage) => {
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (buffer += chunk));
        resolve({ received: () => buffer, close: () => req.destroy() });
      },
    );
    req.on('error', (err) =>
      err.message === 'socket hang up' ? undefined : reject(err),
    );
    req.end();
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Cập nhật thời gian thực qua SSE (e2e) — mục 11.2', () => {
  let app: TestApp;
  let staff: string;
  let port: number;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    const server = app.getHttpServer() as unknown as Server;
    port = (server.address() as AddressInfo).port;
    staff = await login(app, SEED_USERS.staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('pushes surgery updates only to linked family members', async () => {
    const surgeryId = await createSurgery(app, staff);
    const linked = await openStream(
      port,
      await linkNewFamily(app, staff, surgeryId),
    );
    const stranger = await openStream(port, await registerFamily(app));
    try {
      await api(app, staff)
        .post(`/surgeries/${surgeryId}/status`)
        .send({ statusCode: 'PREPARING' })
        .expect(201);
      await sleep(500);
      expect(linked.received()).toContain('event: surgery.updated');
      expect(linked.received()).toContain(surgeryId);
      expect(linked.received()).toContain('event: notification.created');
      expect(stranger.received()).not.toContain(surgeryId);
    } finally {
      linked.close();
      stranger.close();
    }
  });

  it('rejects the event stream without login', async () => {
    await api(app).get('/events').expect(401);
  });
});
