import { expect, test } from '@playwright/test';
import { appAlert, evidence, FAMILY, login, mobilePage, registerFamily, seedPassword, STAFF, unique } from './helpers';

test.describe.serial('Trường hợp lỗi và bảo vệ phiên', () => {
  test('TC-12: đăng nhập sai mật khẩu báo lỗi rõ ràng', async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByLabel('Email hoặc số điện thoại').fill(STAFF);
    await page.getByLabel('Mật khẩu').fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(appAlert(page)).toHaveText(/Sai email\/số điện thoại hoặc mật khẩu/);
    await evidence(page, 'TC-12');
  });

  test('TC-04: mã đã thu hồi không liên kết được', async ({ browser, page }) => {
    await login(page, STAFF);
    await page.goto('/staff');
    await page.getByRole('link', { name: /DEMO-004/ }).click();
    await page.getByRole('button', { name: 'Cấp mã theo dõi mới' }).click();
    const code = (await page.locator('span.font-mono.text-3xl').textContent()) ?? '';
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Thu hồi' }).first().click();
    await expect(page.getByText(/Đã thu hồi/).first()).toBeVisible();
    await evidence(page, 'TC-04a-thu-hoi-ma');

    const family = await mobilePage(browser);
    await registerFamily(family, 'Đỗ Thị Mai');
    await family.goto(`/lien-ket?code=${code}`);
    await family.getByRole('button', { name: 'Theo dõi bệnh nhân' }).click();
    await expect(appAlert(family)).toHaveText(/không còn hiệu lực/);
    await evidence(family, 'TC-04');
  });

  test('TC-05: nhập sai mã 5 lần thì bị tạm khóa', async ({ browser }) => {
    const family = await mobilePage(browser);
    await registerFamily(family, 'Bùi Văn Nam');
    await family.goto('/lien-ket');
    const input = family.getByLabel('Mã theo dõi (8 ký tự)');
    for (let i = 0; i < 6; i += 1) {
      await input.fill(`AAAA-AA${'BCDEFGH'[i]}${'K'}`);
      await family.getByRole('button', { name: 'Theo dõi bệnh nhân' }).click();
      await expect(appAlert(family)).toBeVisible();
    }
    await expect(appAlert(family)).toHaveText(/nhập sai quá nhiều lần/);
    await evidence(family, 'TC-05');
  });

  test('TC-40: người nhà đăng nhập với link của nhân viên → về trang của mình', async ({ browser }) => {
    const family = await mobilePage(browser);
    await family.goto('/dang-nhap?next=%2Fstaff');
    await family.getByLabel('Email hoặc số điện thoại').fill(FAMILY);
    await family.getByLabel('Mật khẩu').fill(seedPassword());
    await family.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(family).toHaveURL(/\/theo-doi$/);
    await expect(family.getByText('Bệnh nhân đang theo dõi')).toBeVisible();
    await evidence(family, 'TC-40');
  });

  test('TC-39: phiên bị thu hồi khi đang mở link QR → đăng nhập lại giữ nguyên mã', async ({ browser, request }) => {
    const family = await mobilePage(browser);
    const phone = await registerFamily(family, 'Ngô Thị Lan');
    // Đổi mật khẩu từ "thiết bị khác" → phiên trên điện thoại bị thu hồi
    const token = (await (await request.post('/api/auth/login', { data: { identifier: phone, password: 'NguoiNha@2026' } })).json()).accessToken as string;
    const changed = await request.put('/api/auth/password', {
      headers: { Authorization: `Bearer ${token}` },
      data: { currentPassword: 'NguoiNha@2026', newPassword: 'MatKhauMoi@2026' },
    });
    expect(changed.ok()).toBeTruthy();
    const code = 'ABCD-EFGH';
    await family.goto(`/lien-ket?code=${code}`);
    await family.getByRole('button', { name: 'Theo dõi bệnh nhân' }).click();
    await expect(family).toHaveURL(/dang-nhap\?next=%2Flien-ket%3Fcode%3DABCD-EFGH/);
    await evidence(family, 'TC-39a-het-phien');
    await family.getByLabel('Email hoặc số điện thoại').fill(phone);
    await family.getByLabel('Mật khẩu').fill('MatKhauMoi@2026');
    await family.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(family.getByLabel('Mã theo dõi (8 ký tự)')).toHaveValue(code);
    await evidence(family, 'TC-39');
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

  test('TC-14: trang nội bộ yêu cầu đăng nhập', async ({ page }) => {
    await page.goto(`/staff?x=${unique('')}`);
    await expect(page).toHaveURL(/dang-nhap\?next=/);
  });
});
