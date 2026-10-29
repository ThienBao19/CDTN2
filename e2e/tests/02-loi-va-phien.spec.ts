import { expect, test } from '@playwright/test';
import { appAlert, DEMO_FAMILY, evidence, familyEnter, login, mobilePage, STAFF, unique } from './helpers';

test.describe.serial('Trường hợp lỗi và bảo vệ phiên', () => {
  test('TC-12: nhân viên đăng nhập sai mật khẩu báo lỗi rõ ràng', async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByLabel('Email').fill(STAFF);
    await page.getByLabel('Mật khẩu').fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(appAlert(page)).toHaveText(/Sai email\/số điện thoại hoặc mật khẩu/);
    await evidence(page, 'TC-12');
  });

  test('người nhà gõ không dấu, viết hoa thường lẫn lộn vẫn vào được', async ({ browser }) => {
    const family = await mobilePage(browser);
    await familyEnter(family, { phone: '0901 234 567', fullName: 'nguyen thi MAI', patientName: 'nguyen van an' });
    await expect(family).toHaveURL(/\/theo-doi$/);
    await expect(family.getByText('N. V. An')).toBeVisible();
    await evidence(family, 'TC-03b-khong-dau');
  });

  test('TC-04: sai tên bệnh nhân thì không vào được', async ({ browser }) => {
    const family = await mobilePage(browser);
    await familyEnter(family, { ...DEMO_FAMILY, patientName: 'Nguyễn Văn Anh' });
    await expect(appAlert(family)).toHaveText(/chưa khớp với đăng ký của bệnh viện/);
    await evidence(family, 'TC-04');
  });

  test('TC-05: nhập sai 5 lần thì bị tạm khóa', async ({ browser }) => {
    const family = await mobilePage(browser);
    const phone = '09' + Date.now().toString().slice(-8);
    for (let i = 0; i < 6; i += 1) {
      await familyEnter(family, { phone, fullName: 'Người Lạ', patientName: `Bệnh Nhân ${i}` });
      await expect(appAlert(family)).toBeVisible();
    }
    await expect(appAlert(family)).toHaveText(/nhập sai quá nhiều lần/);
    await evidence(family, 'TC-05');
  });

  test('TC-40: người nhà không dùng được trang đăng nhập nhân viên', async ({ browser }) => {
    const family = await mobilePage(browser);
    await family.goto('/dang-nhap');
    await family.getByLabel('Email').fill(DEMO_FAMILY.phone);
    await family.getByLabel('Mật khẩu').fill('bat-ky');
    await family.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(appAlert(family)).toBeVisible();
    await expect(family.getByRole('link', { name: 'Vào xem bằng số điện thoại' })).toBeVisible();
    await evidence(family, 'TC-40');
  });

  test('TC-41: nhân viên không thao tác 30 phút thì tự đăng xuất', async ({ page }) => {
    await page.clock.install();
    await login(page, STAFF);
    await expect(page.getByText('Ca phẫu thuật')).toBeVisible();
    await page.clock.fastForward('31:00');
    await expect(page).toHaveURL(/dang-nhap\?het-phien=1/, { timeout: 10_000 });
    await expect(page.getByText(/Phiên làm việc đã kết thúc do không hoạt động/)).toBeVisible();
    await evidence(page, 'TC-41');
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(401);
  });

  test('TC-14: trang nội bộ yêu cầu đăng nhập; trang người nhà dẫn về /nguoi-nha', async ({ page }) => {
    await page.goto(`/staff?x=${unique('')}`);
    await expect(page).toHaveURL(/dang-nhap\?next=/);
    await page.goto('/theo-doi');
    await expect(page).toHaveURL(/\/nguoi-nha$/);
  });
});
