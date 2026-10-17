import { expect, test, type Page } from '@playwright/test';
import { evidence, login, mobilePage, registerFamily, STAFF, unique } from './helpers';

// Luồng trình diễn đầy đủ (mục 13.3): tạo ca → cấp mã → người nhà liên kết → đổi trạng thái → thông báo
test.describe.serial('Luồng chính nhân viên và người nhà', () => {
  let staff: Page;
  let family: Page;
  let surgeryUrl = '';
  let code = '';

  test.beforeAll(async ({ browser }) => {
    staff = await browser.newPage();
    family = await mobilePage(browser);
    await login(staff, STAFF);
  });

  test('TC-16: nhân viên tạo bệnh nhân mới và ca phẫu thuật', async () => {
    await staff.goto('/staff/ca-moi');
    await staff.getByLabel('Bệnh nhân mới').check();
    await staff.getByLabel('Mã bệnh nhân').fill(unique('BN-'));
    await staff.getByLabel('Họ tên bệnh nhân').fill('Võ Thị Hạnh');
    await staff.getByLabel('Ngày sinh').fill('1968-07-21');
    await staff.getByLabel('Giới tính').selectOption('FEMALE');
    await staff.getByLabel('Tên ca').fill('Phẫu thuật cắt túi mật nội soi');
    await staff.getByLabel('Giờ dự kiến').fill('2026-10-16T15:30');
    await staff.getByLabel('Phòng mổ').selectOption({ label: 'Phòng mổ 2' });
    await staff.getByRole('button', { name: 'Tạo ca' }).click();
    await expect(staff).toHaveURL(/\/staff\/ca\//);
    await expect(staff.getByRole('button', { name: /Chuyển sang: Đang chuẩn bị/ })).toBeVisible();
    surgeryUrl = staff.url();
    await evidence(staff, 'TC-16');
  });

  test('UC-01: cấp mã theo dõi kèm QR cho người nhà', async () => {
    await staff.getByRole('button', { name: 'Cấp mã theo dõi mới' }).click();
    const codeText = staff.locator('span.font-mono.text-3xl');
    await expect(codeText).toHaveText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    code = (await codeText.textContent()) ?? '';
    await expect(staff.getByAltText(/QR mã/)).toBeVisible();
    await evidence(staff, 'UC-01-cap-ma-QR');
  });

  test('TC-22: mở link QR khi chưa đăng nhập → đăng ký → mã được điền sẵn', async () => {
    await family.goto(`/lien-ket?code=${code}`);
    await expect(family).toHaveURL(/dang-nhap\?next=/);
    await family.getByRole('link', { name: 'Đăng ký' }).click();
    await registerFamily(family, 'Võ Minh Tuấn', `/lien-ket?code=${code}`);
    await expect(family).toHaveURL(/lien-ket/);
    await expect(family.getByLabel('Mã theo dõi (8 ký tự)')).toHaveValue(code);
    await evidence(family, 'TC-22');
  });

  test('TC-03: người nhà liên kết và thấy trạng thái ca', async () => {
    await family.getByRole('button', { name: 'Theo dõi bệnh nhân' }).click();
    await expect(family).toHaveURL(/\/theo-doi\//);
    await expect(family.locator('.text-3xl.text-primary')).toHaveText('Đã tiếp nhận');
    await expect(family.getByText('V. T. Hạnh')).toBeVisible();
    await evidence(family, 'TC-03');
  });

  test('TC-01: nhân viên chuyển trạng thái có bước xác nhận', async () => {
    await staff.goto(surgeryUrl);
    await staff.getByRole('button', { name: /Chuyển sang: Đang chuẩn bị/ }).click();
    await expect(staff.getByText(/Xác nhận chuyển sang/)).toBeVisible();
    await evidence(staff, 'TC-01a-xac-nhan');
    await staff.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(staff.getByRole('button', { name: /Chuyển sang: Đang phẫu thuật/ })).toBeVisible();
    await evidence(staff, 'TC-01');
  });

  test('TC-26: màn hình người nhà tự cập nhật ngay (SSE)', async () => {
    await expect(family.locator('.text-3xl.text-primary')).toHaveText('Đang chuẩn bị', { timeout: 5000 });
    await evidence(family, 'TC-26');
  });

  test('TC-24: đổi giờ mổ → người nhà nhận thông báo đổi lịch', async () => {
    await staff.getByText('Sửa thông tin ca (tên, giờ, phòng)').click();
    await staff.getByLabel('Giờ dự kiến').fill('2026-10-16T16:30');
    await staff.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(staff.getByText(/Đã lưu/)).toBeVisible();
    await evidence(staff, 'TC-24a-sua-ca');
    await family.goto('/thong-bao');
    await expect(family.getByText(/Lịch phẫu thuật có thay đổi/)).toBeVisible();
    await evidence(family, 'TC-24');
  });

  test('TC-08: người nhà ngừng theo dõi ở trang Cài đặt', async () => {
    await family.goto('/cai-dat');
    await evidence(family, 'TC-08a-cai-dat');
    family.once('dialog', (d) => void d.accept());
    await family.getByRole('button', { name: 'Hủy liên kết' }).click();
    await expect(family.getByText('Chưa có liên kết nào.')).toBeVisible();
    await evidence(family, 'TC-08');
  });
});
