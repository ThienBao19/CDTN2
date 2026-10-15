# Hệ thống Theo dõi và Thông báo tình trạng bệnh nhân

Đồ án Chuyên đề tốt nghiệp 2 (CNPM, Văn Lang). Người nhà theo dõi ca phẫu thuật trên điện thoại.
Nhân viên y tế cập nhật trạng thái theo 5 giai đoạn, và hệ thống gửi thông báo đẩy cho người nhà đã liên kết.

## Kiến trúc

```
apps/
  api/      NestJS 11 + Prisma 6 + PostgreSQL 16   → http://localhost:4000/api
  web/      Next.js 15 (App Router, Tailwind 4)     → http://localhost:3000
            ├─ /           trang chọn vai trò
            ├─ /lien-ket   PWA người nhà (liên kết mã/QR, theo dõi)
            ├─ /staff      web nhân viên y tế
            └─ /admin      trang quản trị
packages/
  shared/   hằng số dùng chung (vai trò, 5 trạng thái ca)
docs/       nhật ký thực hiện, backlog
```

Monorepo dùng pnpm workspaces + Turborepo. Thông báo đẩy dùng Firebase Cloud Messaging (sẽ tích hợp ở Sprint 2).

## Chạy local

Yêu cầu: Node ≥ 20, pnpm 9, Docker Desktop.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # điền SEED_PASSWORD
cp apps/web/.env.example apps/web/.env.local
pnpm db:up                                     # PostgreSQL ở cổng 5440
pnpm --filter @pt/shared build
pnpm db:migrate
pnpm db:seed                                   # 5 trạng thái, 3 phòng, 3 tài khoản demo
pnpm dev                                       # chạy API + web
```

Tài khoản demo sau khi seed: `admin@example.com`, `staff@example.com`, `family@example.com`.
Cả ba dùng mật khẩu `SEED_PASSWORD` trong `apps/api/.env`.

## Lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `pnpm build` | Build toàn bộ |
| `pnpm test` | Unit test (Jest) |
| `pnpm --filter @pt/api test:e2e` | Test API với CSDL thật |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Mở Prisma Studio xem dữ liệu |

## Tài liệu

- [Backlog và truy vết yêu cầu](docs/backlog.md)
- [Nhật ký thực hiện đề tài](docs/nhat-ky-thuc-hien.md)
- Tài liệu dự án gốc và 10 bài giảng nằm ở thư mục gốc. Các file này chỉ để local và không đưa lên git.
