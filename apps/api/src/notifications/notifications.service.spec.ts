import { DeliveryStatus, Notification } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider, PushResult } from '../push/push-provider';
import { NotificationsService } from './notifications.service';

const notification = {
  id: 'n1',
  userId: 'u1',
  surgeryId: 's1',
  content: 'Ca phẫu thuật đã bắt đầu.',
} as Notification;

function setup(options: {
  isEnabled: boolean;
  tokens: string[];
  results?: PushResult[];
}) {
  const prisma = {
    deviceToken: {
      findMany: jest
        .fn()
        .mockResolvedValue(options.tokens.map((token) => ({ token }))),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    notification: { update: jest.fn().mockResolvedValue({}) },
  };
  const send = jest.fn<Promise<PushResult>, [string[], unknown]>();
  (options.results ?? []).forEach((r) => send.mockResolvedValueOnce(r));
  const push = {
    isEnabled: () => options.isEnabled,
    send,
  } as unknown as PushProvider;
  const service = new NotificationsService(
    prisma as unknown as PrismaService,
    push,
    new EventsService(),
  );
  service.useSleep(() => Promise.resolve());
  return { service, prisma, send };
}

function lastUpdate(prisma: ReturnType<typeof setup>['prisma']): unknown {
  const calls = prisma.notification.update.mock.calls as Array<
    [{ data: unknown }]
  >;
  return calls[calls.length - 1][0].data;
}

describe('NotificationsService.deliver', () => {
  it('skips push when FCM is not configured', async () => {
    const { service, send } = setup({ isEnabled: false, tokens: ['t1'] });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.SKIPPED,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('skips push when the user has no registered device', async () => {
    const { service } = setup({ isEnabled: true, tokens: [] });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.SKIPPED,
    );
  });

  it('marks SENT and sends discreet content without patient names', async () => {
    const { service, send } = setup({
      isEnabled: true,
      tokens: ['t1'],
      results: [{ successCount: 1, invalidTokens: [], errors: [] }],
    });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.SENT,
    );
    const [tokens, message] = send.mock.calls[0];
    expect(tokens).toEqual(['t1']);
    expect(message).toMatchObject({
      body: notification.content,
      data: { url: '/theo-doi/s1' },
    });
  });

  it('retries on temporary errors then succeeds', async () => {
    const fail = {
      successCount: 0,
      invalidTokens: [],
      errors: ['messaging/unavailable'],
    };
    const { service, send, prisma } = setup({
      isEnabled: true,
      tokens: ['t1'],
      results: [fail, { successCount: 1, invalidTokens: [], errors: [] }],
    });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.SENT,
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(lastUpdate(prisma)).toMatchObject({ attempts: 2 });
  });

  it('marks FAILED after 3 attempts with the last error recorded', async () => {
    const fail = {
      successCount: 0,
      invalidTokens: [],
      errors: ['messaging/unavailable'],
    };
    const { service, send, prisma } = setup({
      isEnabled: true,
      tokens: ['t1'],
      results: [fail, fail, fail],
    });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.FAILED,
    );
    expect(send).toHaveBeenCalledTimes(3);
    expect(lastUpdate(prisma)).toMatchObject({
      lastError: 'messaging/unavailable',
    });
  });

  it('removes invalid device tokens and does not retry them', async () => {
    const { service, send, prisma } = setup({
      isEnabled: true,
      tokens: ['dead'],
      results: [{ successCount: 0, invalidTokens: ['dead'], errors: [] }],
    });
    await expect(service.deliver(notification)).resolves.toBe(
      DeliveryStatus.FAILED,
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['dead'] } },
    });
  });
});
