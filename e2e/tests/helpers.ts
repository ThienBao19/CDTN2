import { expect, type Browser, type Page } from '@playwright/test';
import path from 'node:path';

export const EVIDENCE_DIR = path.resolve(__dirname, '../../docs/kiem-thu/anh');
export const MOBILE = { width: 390, height: 844 };
export const STAFF = 'staff@example.com';
export const ADMIN = 'admin@example.com';
export const FAMILY = 'family@example.com';

// Thông báo lỗi của ứng dụng (Next.js có sẵn một role=alert ẩn để đọc màn hình)
export function appAlert(page: Page) {
  return page.locator('p[role=alert]');
}

export function seedPassword(): string {
  const password = process.env.E2E_SEED_PASSWORD;
  if (!password) throw new Error('Thiếu E2E_SEED_PASSWORD (SEED_PASSWORD trong deploy/.env)');
  return password;
}

// Ảnh minh chứng đặt tên theo mã test case, lưu vào docs/kiem-thu/anh
export async function evidence(page: Page, name: string): Promise<void> {
  // Không chờ networkidle: trang luôn giữ kết nối SSE mở. Chờ font tải xong để ảnh rõ chữ.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${name}.png`), fullPage: true });
}

export async function login(page: Page, identifier: string, password = seedPassword()): Promise<void> {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email hoặc số điện thoại').fill(identifier);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}

export async function mobilePage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  return context.newPage();
}

let counter = 0;
export function unique(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now().toString().slice(-6)}${counter}`;
}

// Đăng ký người nhà mới qua giao diện, trả về số điện thoại dùng đăng nhập
export async function registerFamily(page: Page, fullName: string, next?: string): Promise<string> {
  const phone = `09${Date.now().toString().slice(-8)}`;
  await page.goto(next ? `/dang-ky?next=${encodeURIComponent(next)}` : '/dang-ky');
  await page.getByLabel('Họ tên').fill(fullName);
  await page.getByLabel('Số điện thoại hoặc email').fill(phone);
  await page.getByLabel('Mật khẩu (tối thiểu 8 ký tự)').fill('NguoiNha@2026');
  await page.getByLabel('Nhập lại mật khẩu').fill('NguoiNha@2026');
  await page.getByRole('button', { name: 'Đăng ký' }).click();
  await expect(page).not.toHaveURL(/dang-ky/);
  return phone;
}
