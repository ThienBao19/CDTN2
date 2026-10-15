import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FcmPushProvider } from './fcm-push.provider';
import { DisabledPushProvider, PushProvider } from './push-provider';

@Global()
@Module({
  providers: [
    {
      provide: PushProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): PushProvider => {
        const account = config.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
        if (!account) {
          new Logger('PushModule').warn(
            'Chưa cấu hình FIREBASE_SERVICE_ACCOUNT_BASE64: không gửi push',
          );
          return new DisabledPushProvider();
        }
        return new FcmPushProvider(account);
      },
    },
  ],
  exports: [PushProvider],
})
export class PushModule {}
