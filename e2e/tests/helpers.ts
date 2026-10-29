import { expect, type Browser, type Page } from '@playwright/test';
import path from 'node:path';

export const EVIDENCE_DIR = path.resolve(__dirname, '../../docs/kiem-thu/anh');
export const MOBILE = { width: 390, height: 844 };
export const STAFF = 'nhanvien1@benhvien.test';
export const ADMIN = 'admin@benhvien.test';
// Người nhà demo do seed-demo đăng ký sẵn (không có mật khẩu)
export const DEMO_FAMILY = { phone: '0901234567', fullName: 'Nguyễn Thị Mai', patientName: 'Nguyễn Văn An' };

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
  await page.getByLabel('Email').fill(identifier);
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

export function uniquePhone(): string {
  return '09' + Date.now().toString().slice(-8);
}

// Người nhà vào xem: SĐT + họ tên mình + họ tên bệnh nhân
export async function familyEnter(
  page: Page,
  info: { phone: string; fullName: string; patientName: string },
): Promise<void> {
  await page.goto('/nguoi-nha');
  await page.getByLabel('Số điện thoại của bạn').fill(info.phone);
  await page.getByLabel('Họ tên của bạn').fill(info.fullName);
  await page.getByLabel('Họ tên bệnh nhân').fill(info.patientName);
  await page.getByRole('button', { name: 'Xem tình trạng bệnh nhân' }).click();
}
