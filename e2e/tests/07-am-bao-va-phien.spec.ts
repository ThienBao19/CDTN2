import { expect, test, type Page } from '@playwright/test';
import { evidence, familyEnter, login, mobilePage, STAFF, unique, uniquePhone } from './helpers';

// Đếm số nốt nhạc đã phát (Web Audio) và số lần rung để kiểm tra âm báo trong trình duyệt
const COUNT_SOUNDS = () => {
  const w = window as unknown as { __tones: number; __vibrations: number };
  w.__tones = 0;
  w.__vibrations = 0;
  const create = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function (this: AudioContext) {
    w.__tones += 1;
    return create.call(this);
  };
  Object.defineProperty(navigator, 'vibrate', {
    value: () => {
      w.__vibrations += 1;
      return true;
    },
  });
};

function sounds(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __tones: number; __vibrations: number };
    return { tones: w.__tones, vibrations: w.__vibrations };
  });
}

async function advance(staff: Page, label: string): Promise<void> {
  await staff.getByRole('button', { name: new RegExp(`Chuyển sang: ${label}`) }).click();
  await staff.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(staff.getByRole('button', { name: new RegExp(`Chuyển sang: ${label}`) })).toBeHidden();
}

test.describe.serial('Âm báo, chuông khi kết thúc và giữ phiên người nhà', () => {
  let staff: Page;
  let family: Page;
  const patientName = 'Đặng Thu Trang';
  const contact = { phone: uniquePhone(), fullName: 'Đặng Văn Hùng' };

  test.beforeAll(async ({ browser }) => {
    staff = await browser.newPage();
    family = await mobilePage(browser);
    await family.addInitScript(COUNT_SOUNDS);
    await login(staff, STAFF);
    await staff.goto('/staff/ca-moi');
    await staff.getByLabel('Bệnh nhân mới').check();
    await staff.getByLabel('Mã bệnh nhân').fill(unique('BN-'));
    await staff.getByLabel('Họ tên bệnh nhân').fill(patientName);
    await staff.getByLabel('Ngày sinh').fill('1975-02-14');
    await staff.getByLabel('Giới tính').selectOption('FEMALE');
    await staff.getByLabel('Tên ca').fill('Phẫu thuật nội soi khớp gối');
    await staff.getByLabel('Giờ dự kiến').fill('2026-10-29T15:00');
    await staff.getByRole('button', { name: 'Tạo ca' }).click();
    // Chạy với web dev thì lần đầu phải biên dịch trang, chờ lâu hơn
    await expect(staff).toHaveURL(/\/staff\/ca\//, { timeout: 30_000 });
    await staff.getByLabel('Số điện thoại').fill(contact.phone);
    await staff.getByLabel('Họ tên người nhà').fill(contact.fullName);
    await staff.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(staff.getByText(`Đã đăng ký ${contact.fullName}`)).toBeVisible();
  });

  test('TC-52: mở lại app khi phiên còn hạn thì vào thẳng màn hình theo dõi', async () => {
    await familyEnter(family, { ...contact, patientName });
    await expect(family).toHaveURL(/\/theo-doi$/);
    // Giống mở lại app từ màn hình chính: vào trang chủ và trang nhập thông tin
    await family.goto('/');
    await expect(family).toHaveURL(/\/theo-doi$/);
    await family.goto('/nguoi-nha');
    await expect(family).toHaveURL(/\/theo-doi$/);
    await expect(family.getByText('Đ. T. Trang')).toBeVisible();
    await evidence(family, 'TC-52-mo-lai-app');
  });

  test('TC-53: xong một giai đoạn thì kêu âm báo ngắn và rung', async () => {
    await family.getByRole('heading', { name: 'Bệnh nhân đang theo dõi' }).click(); // chạm để mở khóa âm thanh
    await advance(staff, 'Đang chuẩn bị');
    await expect.poll(() => sounds(family)).toEqual({ tones: 2, vibrations: 1 });
    await expect(family.getByRole('alertdialog')).toBeHidden();
    await expect(family.getByText('Đang chuẩn bị')).toBeVisible();
    await evidence(family, 'TC-53-am-bao-giai-doan');
  });

  test('TC-54: ca kết thúc thì chuông reo, rung liên tục tới khi bấm tắt', async () => {
    await advance(staff, 'Đang phẫu thuật');
    await advance(staff, 'Đang hồi tỉnh');
    await advance(staff, 'Đã hoàn tất');
    const dialog = family.getByRole('alertdialog');
    await expect(dialog).toContainText('Ca phẫu thuật đã hoàn tất');
    const first = await sounds(family);
    await expect.poll(async () => (await sounds(family)).tones, { timeout: 5000 }).toBeGreaterThan(first.tones);
    await evidence(family, 'TC-54-chuong-ket-thuc');
    await dialog.getByRole('button', { name: 'Tắt chuông' }).click();
    await expect(dialog).toBeHidden();
    const stopped = await sounds(family);
    await family.waitForTimeout(2500);
    expect((await sounds(family)).tones).toBe(stopped.tones);
  });
});
