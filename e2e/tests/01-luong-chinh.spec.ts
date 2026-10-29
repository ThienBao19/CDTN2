import { expect, test, type Page } from '@playwright/test';
import { evidence, familyEnter, login, mobilePage, STAFF, unique, uniquePhone } from './helpers';

// Luồng trình diễn đầy đủ: tạo ca → đăng ký người nhà → người nhà vào xem → đổi trạng thái → thông báo
test.describe.serial('Luồng chính nhân viên và người nhà', () => {
  let staff: Page;
  let family: Page;
  let surgeryUrl = '';
  const contact = { phone: uniquePhone(), fullName: 'Võ Minh Tuấn' };

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
    await staff.getByLabel('Giờ dự kiến').fill('2026-10-17T15:30');
    await staff.getByLabel('Phòng mổ').selectOption({ label: 'Phòng mổ 2' });
    await staff.getByRole('button', { name: 'Tạo ca' }).click();
    await expect(staff).toHaveURL(/\/staff\/ca\//);
    await expect(staff.getByRole('button', { name: /Chuyển sang: Đang chuẩn bị/ })).toBeVisible();
    surgeryUrl = staff.url();
    await evidence(staff, 'TC-16');
  });

  test('UC-01: nhân viên đăng ký người nhà (SĐT + họ tên)', async () => {
    await staff.getByLabel('Số điện thoại').fill(contact.phone);
    await staff.getByLabel('Họ tên người nhà').fill(contact.fullName);
    await staff.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(staff.getByText(`Đã đăng ký ${contact.fullName}`)).toBeVisible();
    await evidence(staff, 'UC-01-dang-ky-nguoi-nha');
  });

  test('TC-03: người nhà vào xem bằng SĐT + họ tên + tên bệnh nhân (không mật khẩu)', async () => {
    await family.goto('/nguoi-nha');
    await family.getByLabel('Số điện thoại của bạn').fill(contact.phone);
    await family.getByLabel('Họ tên của bạn').fill(contact.fullName);
    await family.getByLabel('Họ tên bệnh nhân').fill('Võ Thị Hạnh');
    await evidence(family, 'TC-03a-nhap-thong-tin');
    await family.getByRole('button', { name: 'Xem tình trạng bệnh nhân' }).click();
    await expect(family).toHaveURL(/\/theo-doi$/);
    await family.getByText('V. T. Hạnh').click();
    await expect(family.locator('.text-3xl.text-primary')).toHaveText('Đã tiếp nhận');
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
    await staff.getByLabel('Giờ dự kiến').fill('2026-10-17T16:30');
    await staff.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(staff.getByText(/Đã lưu/)).toBeVisible();
    await evidence(staff, 'TC-24a-sua-ca');
    await family.goto('/thong-bao');
    await expect(family.getByText(/Lịch phẫu thuật có thay đổi/)).toBeVisible();
    await evidence(family, 'TC-24');
  });

  test('TC-08: nhân viên gỡ quyền → người nhà không xem được nữa', async () => {
    await family.goto('/cai-dat');
    await evidence(family, 'TC-08a-cai-dat');
    staff.once('dialog', (d) => void d.accept());
    await staff.getByRole('button', { name: 'Gỡ quyền' }).click();
    await expect(staff.getByText('Đã gỡ')).toBeVisible();
    await family.goto('/theo-doi');
    await expect(family).toHaveURL(/\/nguoi-nha$/);
    await familyEnter(family, { ...contact, patientName: 'Võ Thị Hạnh' });
    await expect(family.locator('p[role=alert]')).toHaveText(/chưa khớp/);
    await evidence(family, 'TC-08');
  });
});
