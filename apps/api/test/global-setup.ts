import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';

// Áp migration và seed (idempotent) lên CSDL test; không xóa dữ liệu.
// Mỗi test tự tạo dữ liệu riêng với mã ngẫu nhiên nên chạy lại nhiều lần được.
export default function globalSetup(): void {
  const cwd = resolve(__dirname, '..');
  config({ path: resolve(cwd, '.env'), quiet: true });
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) throw new Error('Thiếu DATABASE_URL_TEST trong apps/api/.env');
  const env = { ...process.env, DATABASE_URL: testUrl };
  for (const cmd of ['npx prisma migrate deploy', 'npx prisma db seed']) {
    execSync(cmd, { cwd, env, stdio: 'ignore' });
  }
}
