// Dữ liệu demo cho buổi báo cáo: các ca hôm nay ở đủ trạng thái, có lịch sử và thông báo.
// Chạy sau seed chính: pnpm --filter @pt/api prisma:seed-demo (chạy lại không tạo trùng).
import { DeliveryStatus, Gender, PrismaClient, Role } from '@prisma/client';

// Người nhà demo do nhân viên đăng ký: vào xem bằng SĐT + họ tên + tên bệnh nhân
export const DEMO_FAMILY = { phone: '0901234567', fullName: 'Nguyễn Thị Mai' };

const prisma = new PrismaClient();
const MINUTE = 60 * 1000;

type DemoCase = {
  code: string;
  name: string;
  dob: string;
  gender: Gender;
  title: string;
  room: string;
  startOffsetMin: number;
  reachedOrder: number;
  linkFamily: boolean;
};

const CASES: DemoCase[] = [
  {
    code: 'DEMO-001',
    name: 'Nguyễn Văn An',
    dob: '1958-03-20',
    gender: Gender.MALE,
    title: 'Phẫu thuật nội soi túi mật',
    room: 'Phòng mổ 1',
    startOffsetMin: -180,
    reachedOrder: 4,
    linkFamily: true,
  },
  {
    code: 'DEMO-002',
    name: 'Trần Thị Bích',
    dob: '1972-11-02',
    gender: Gender.FEMALE,
    title: 'Thay khớp gối trái',
    room: 'Phòng mổ 2',
    startOffsetMin: -90,
    reachedOrder: 3,
    linkFamily: true,
  },
  {
    code: 'DEMO-003',
    name: 'Lê Văn Cường',
    dob: '1985-06-15',
    gender: Gender.MALE,
    title: 'Mổ ruột thừa',
    room: 'Phòng mổ 1',
    startOffsetMin: -40,
    reachedOrder: 2,
    linkFamily: false,
  },
  {
    code: 'DEMO-004',
    name: 'Phạm Thị Dung',
    dob: '1990-01-30',
    gender: Gender.FEMALE,
    title: 'Cắt u tuyến giáp',
    room: 'Phòng mổ 2',
    startOffsetMin: 60,
    reachedOrder: 1,
    linkFamily: false,
  },
  {
    code: 'DEMO-005',
    name: 'Hoàng Văn Em',
    dob: '1949-09-09',
    gender: Gender.MALE,
    title: 'Thay van tim',
    room: 'Phòng mổ 1',
    startOffsetMin: -420,
    reachedOrder: 5,
    linkFamily: false,
  },
];

async function createCase(
  c: DemoCase,
  ids: { staffId: string; familyId: string },
) {
  const statuses = await prisma.statusDefinition.findMany({
    where: { workflow: 'SURGERY' },
    orderBy: { sortOrder: 'asc' },
  });
  const room = await prisma.room.findUnique({ where: { name: c.room } });
  const start = Date.now() + c.startOffsetMin * MINUTE;
  const reached = statuses.filter((s) => s.sortOrder <= c.reachedOrder);
  const current = reached[reached.length - 1];
  // Mỗi bước cách nhau 25 phút, không vượt quá hiện tại
  const times = reached.map(
    (_, i) =>
      new Date(
        Math.min(
          start + i * 25 * MINUTE,
          Date.now() - (reached.length - i) * MINUTE,
        ),
      ),
  );

  await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.create({
      data: {
        patientCode: c.code,
        fullName: c.name,
        dateOfBirth: new Date(c.dob),
        gender: c.gender,
      },
    });
    const surgery = await tx.surgery.create({
      data: {
        patientId: patient.id,
        roomId: room?.id,
        title: c.title,
        scheduledAt: new Date(start),
        currentStatusId: current.id,
        createdById: ids.staffId,
      },
    });
    await tx.statusHistory.createMany({
      data: reached.map((s, i) => ({
        surgeryId: surgery.id,
        statusId: s.id,
        updatedById: ids.staffId,
        changedAt: times[i],
        note: i === 0 ? 'Tạo ca' : null,
      })),
    });
    if (!c.linkFamily) return;
    await tx.familyLink.create({
      data: {
        userId: ids.familyId,
        surgeryId: surgery.id,
        contactName: DEMO_FAMILY.fullName,
        addedById: ids.staffId,
        linkedAt: times[0],
      },
    });
    await tx.notification.createMany({
      data: reached.slice(1).map((s, i) => ({
        userId: ids.familyId,
        surgeryId: surgery.id,
        content: s.notificationMessage,
        status: DeliveryStatus.SKIPPED,
        createdAt: times[i + 1],
        readAt: i < reached.length - 2 ? times[i + 1] : null,
      })),
    });
  });
}

async function main() {
  const staff = await prisma.user.findUnique({
    where: { email: 'nhanvien1@benhvien.test' },
  });
  if (!staff) throw new Error('Chạy seed chính trước (pnpm db:seed)');
  // Người nhà không có mật khẩu; nhân viên đăng ký SĐT + họ tên vào ca
  const family = await prisma.user.upsert({
    where: { phone: DEMO_FAMILY.phone },
    update: {},
    create: { ...DEMO_FAMILY, role: Role.FAMILY },
  });
  let created = 0;
  for (const c of CASES) {
    const exists = await prisma.patient.findUnique({
      where: { patientCode: c.code },
    });
    if (exists) continue;
    await createCase(c, { staffId: staff.id, familyId: family.id });
    created += 1;
  }
  console.info(
    `Dữ liệu demo: tạo mới ${created}/${CASES.length} ca. Người nhà demo: ${DEMO_FAMILY.phone} – ${DEMO_FAMILY.fullName}, bệnh nhân Nguyễn Văn An hoặc Trần Thị Bích`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
