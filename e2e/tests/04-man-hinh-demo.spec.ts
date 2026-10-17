import { expect, test } from '@playwright/test';
import { evidence, FAMILY, login, mobilePage, STAFF } from './helpers';

// Ảnh các màn hình chính với dữ liệu demo, dùng cho báo cáo và slide
test.describe.serial('Màn hình demo cho báo cáo', () => {
  test('trang chủ và danh sách ca của nhân viên', async ({ page }) => {
    await page.goto('/');
    await evidence(page, 'demo-01-trang-chu');
    await login(page, STAFF);
    await expect(page.getByText('DEMO-001')).toBeVisible();
    await evidence(page, 'demo-02-nhan-vien-danh-sach-ca');
    await page.getByRole('link', { name: /DEMO-002/ }).click();
    await expect(page.getByText('Lịch sử trạng thái')).toBeVisible();
    await evidence(page, 'demo-03-nhan-vien-chi-tiet-ca');
  });

  test('ứng dụng người nhà trên điện thoại', async ({ browser }) => {
    const family = await mobilePage(browser);
    await login(family, FAMILY);
    await expect(family.getByText('N. V. An')).toBeVisible();
    await evidence(family, 'demo-04-nguoi-nha-danh-sach');
    await family.getByText('N. V. An').click();
    await expect(family.getByText('Lịch sử trạng thái')).toBeVisible();
    await evidence(family, 'demo-05-nguoi-nha-chi-tiet');
    await family.goto('/thong-bao');
    await evidence(family, 'demo-06-nguoi-nha-thong-bao');
    await family.goto('/lien-ket');
    await evidence(family, 'demo-07-nguoi-nha-lien-ket');
  });
});
