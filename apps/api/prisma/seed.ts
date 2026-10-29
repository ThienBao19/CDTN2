import { PrismaClient, Role, RoomType } from '@prisma/client';
import * as argon2 from 'argon2';
import { SURGERY_STATUSES } from '@pt/shared';

const prisma = new PrismaClient();

async function seedStatuses() {
  for (const s of SURGERY_STATUSES) {
    await prisma.statusDefinition.upsert({
      where: { workflow_code: { workflow: 'SURGERY', code: s.code } },
      update: {
        label: s.label,
        description: s.description,
        sortOrder: s.order,
        notificationMessage: s.notification,
      },
      create: {
        workflow: 'SURGERY',
        code: s.code,
        label: s.label,
        description: s.description,
        sortOrder: s.order,
        notificationMessage: s.notification,
      },
    });
  }
}

async function seedRooms() {
  const rooms = [
    {
      name: 'Phòng mổ 1',
      type: RoomType.OPERATING,
      location: 'Tầng 3 - Khu A',
    },
    {
      name: 'Phòng mổ 2',
      type: RoomType.OPERATING,
      location: 'Tầng 3 - Khu A',
    },
    { name: 'Hồi sức 1', type: RoomType.RECOVERY, location: 'Tầng 3 - Khu B' },
  ];
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
  }
}

// Tài khoản demo chỉ dùng cho môi trường phát triển; mật khẩu lấy từ SEED_PASSWORD
async function seedUsers() {
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    throw new Error('Thiếu SEED_PASSWORD trong apps/api/.env');
  }
  const passwordHash = await argon2.hash(password);
  // Người nhà không có tài khoản: nhân viên đăng ký SĐT + họ tên người nhà vào từng ca
  const users = [
    {
      fullName: 'Quản trị viên',
      email: 'admin@benhvien.test',
      role: Role.ADMIN,
    },
    {
      fullName: 'Nguyễn Thị Lan',
      email: 'nhanvien1@benhvien.test',
      role: Role.STAFF,
    },
    {
      fullName: 'Trần Minh Khoa',
      email: 'nhanvien2@benhvien.test',
      role: Role.STAFF,
    },
    {
      fullName: 'Phạm Thu Hà',
      email: 'nhanvien3@benhvien.test',
      role: Role.STAFF,
    },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
  }
}

async function main() {
  await seedStatuses();
  await seedRooms();
  await seedUsers();
  console.info(
    'Seed xong: 5 trạng thái, 3 phòng, 1 quản trị viên, 3 nhân viên y tế',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
