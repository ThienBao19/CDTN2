import { expect, test } from '@playwright/test';
import { ADMIN, evidence, login, unique } from './helpers';

test.describe.serial('Trang quản trị (FR-11, FR-12)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('TC-27 + TC-28: tạo tài khoản nhân viên rồi khóa', async ({ page }) => {
    const email = `${unique('nv')}@example.com`;
    await page.goto('/admin/tai-khoan');
    await page.getByLabel('Họ tên').fill('Lý Thị Thu');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu ban đầu').fill('NhanVien@2026');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    const row = page.getByRole('row', { name: new RegExp(email) });
    await expect(row).toBeVisible();
    await evidence(page, 'TC-27');
    await row.getByRole('button', { name: /Khóa/ }).click();
    await expect(row.getByRole('button', { name: /Đã khóa/ })).toBeVisible();
    await evidence(page, 'TC-28');
  });

  test('TC-29: danh mục phòng và nội dung thông báo', async ({ page }) => {
    await page.goto('/admin/danh-muc');
    await expect(page.getByText('Trạng thái và nội dung thông báo')).toBeVisible();
    await evidence(page, 'TC-29');
  });

  test('TC-30: nhật ký truy cập lọc theo hành động', async ({ page }) => {
    await page.goto('/admin/nhat-ky');
    await page.getByLabel('Hành động').selectOption('LOGIN');
    await expect(page.getByRole('cell', { name: 'Đăng nhập', exact: true }).first()).toBeVisible();
    await evidence(page, 'TC-30');
    await page.getByLabel('Hành động').selectOption('LOGIN_FAILED');
    await expect(page.getByRole('cell', { name: 'Đăng nhập sai' }).first()).toBeVisible();
    await evidence(page, 'TC-44');
  });
});
