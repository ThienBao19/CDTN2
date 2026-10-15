const sendEachForMulticast = jest.fn();

jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(() => 'credential'),
  initializeApp: jest.fn(() => ({ name: 'patient-tracker' })),
}));
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => ({ sendEachForMulticast })),
}));

import { FcmPushProvider } from './fcm-push.provider';

const account = Buffer.from(JSON.stringify({ project_id: 'demo' })).toString(
  'base64',
);
const message = { title: 'T', body: 'B', data: { url: '/theo-doi/s1' } };

describe('FcmPushProvider', () => {
  beforeEach(() => sendEachForMulticast.mockReset());

  it('is enabled once configured', () => {
    expect(new FcmPushProvider(account).isEnabled()).toBe(true);
  });

  it('separates invalid tokens from temporary errors', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered' },
        },
        { success: false, error: { code: 'messaging/unavailable' } },
      ],
    });
    const result = await new FcmPushProvider(account).send(
      ['ok', 'dead', 'busy'],
      message,
    );
    expect(result).toEqual({
      successCount: 1,
      invalidTokens: ['dead'],
      errors: ['messaging/unavailable'],
    });
  });

  it('opens the surgery page when the notification is tapped', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      responses: [{ success: true }],
    });
    await new FcmPushProvider(account).send(['ok'], message);
    const [payload] = sendEachForMulticast.mock.calls[0] as [
      { webpush: unknown },
    ];
    expect(payload.webpush).toEqual({ fcmOptions: { link: '/theo-doi/s1' } });
  });
});
