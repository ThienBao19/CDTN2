import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Cấu hình dùng chung cho main.ts và e2e test
export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;
  // Web gọi API qua proxy của Next.js trên cùng máy
  expressApp.set('trust proxy', 'loopback');
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
