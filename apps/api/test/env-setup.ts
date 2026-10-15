import { config } from 'dotenv';
import { resolve } from 'node:path';

// Chạy trong mỗi worker: trỏ ứng dụng sang CSDL test trước khi AppModule được nạp
config({ path: resolve(__dirname, '../.env'), quiet: true });
const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) throw new Error('Thiếu DATABASE_URL_TEST trong apps/api/.env');
process.env.DATABASE_URL = testUrl;
process.env.RATE_LIMIT = '10000';
process.env.LOGIN_RATE_LIMIT = '1000';
