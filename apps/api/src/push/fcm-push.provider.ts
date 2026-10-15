import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PushMessage, PushProvider, PushResult } from './push-provider';

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

// Firebase Cloud Messaging; service account truyền qua env dạng base64 của file JSON
export class FcmPushProvider extends PushProvider {
  private readonly app: App;

  constructor(serviceAccountBase64: string) {
    super();
    const json = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    this.app = initializeApp(
      { credential: cert(JSON.parse(json) as Record<string, string>) },
      'patient-tracker',
    );
  }

  isEnabled(): boolean {
    return true;
  }

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    const res = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
      webpush: { fcmOptions: { link: message.data.url } },
    });
    const invalidTokens: string[] = [];
    const errors: string[] = [];
    res.responses.forEach((r, i) => {
      if (r.success || !r.error) return;
      if (INVALID_TOKEN_CODES.has(r.error.code)) invalidTokens.push(tokens[i]);
      else errors.push(r.error.code);
    });
    return { successCount: res.successCount, invalidTokens, errors };
  }
}
