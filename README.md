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
docs/       quan-ly/ (backlog, nhật ký), kiem-thu/ (test case, ảnh)
```

Web gọi API qua proxy `/api` của Next.js nên cookie đăng nhập (httpOnly) dùng chung origin.
Monorepo dùng pnpm workspaces + Turborepo. Thông báo đẩy dùng Firebase Cloud Messaging; màn hình đang mở nhận cập nhật realtime qua Server-Sent Events (`/api/events`).

## Chạy local

Yêu cầu: Node ≥ 20, pnpm 9, Docker Desktop.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # điền SEED_PASSWORD, JWT_SECRET, TRACKING_CODE_SECRET
cp apps/web/.env.example apps/web/.env.local
pnpm db:up                                     # PostgreSQL ở cổng 5440
pnpm --filter @pt/shared build
pnpm db:migrate
pnpm db:seed                                   # 5 trạng thái, 3 phòng, 3 tài khoản demo
pnpm dev                                       # chạy API + web
```

Tài khoản demo sau khi seed: `admin@example.com`, `staff@example.com`, `family@example.com`.
Cả ba dùng mật khẩu `SEED_PASSWORD` trong `apps/api/.env`.

## Thông báo đẩy (Firebase Cloud Messaging)

Không bắt buộc khi phát triển. Nếu chưa cấu hình, thông báo vẫn được lưu và hiện ngay trong ứng dụng qua SSE, trạng thái gửi push ghi là `SKIPPED`.

1. Tạo dự án ở Firebase Console, thêm ứng dụng Web.
2. **Project settings › Service accounts › Generate new private key**: mã hoá file JSON sang base64 rồi điền vào `FIREBASE_SERVICE_ACCOUNT_BASE64` trong `apps/api/.env`.
3. **Project settings › General** (config ứng dụng Web) và **Cloud Messaging › Web Push certificates** (VAPID key): điền các biến `NEXT_PUBLIC_FIREBASE_*` trong `apps/web/.env.local`, rồi build lại web.
4. Người nhà vào **Cài đặt › Bật thông báo đẩy**. Trình duyệt chỉ cho đăng ký push trên `localhost` hoặc HTTPS.

## Triển khai bằng Docker

Toàn bộ hệ thống (PostgreSQL, API, web, nginx, sao lưu tự động) chạy bằng một lệnh. nginx là cổng vào duy nhất:
`/api` đi thẳng vào API (SSE không bị đệm, ghi IP thật), còn lại vào web.

```bash
cp deploy/.env.example deploy/.env
```

Điền mật khẩu CSDL, `JWT_SECRET`, `TRACKING_CODE_SECRET` (mỗi khóa ≥ 32 ký tự), `SEED_PASSWORD` trong `deploy/.env`, rồi:

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env exec api npx prisma db seed
```

Mở `http://localhost:8080`. Migration tự chạy mỗi khi API khởi động (`prisma migrate deploy`, không xoá dữ liệu).
Demo trên điện thoại cùng mạng LAN: mở `http://<IP máy>:8080` với `COOKIE_SECURE=false`
(thông báo đẩy trên trình duyệt chỉ hoạt động với `localhost` hoặc HTTPS).

**Sao lưu (NFR-11):** container `backup` chạy `pg_dump` mỗi ngày vào thư mục `backups/`, giữ 7 ngày. Khôi phục:

```bash
gunzip -c backups/<tên file>.sql.gz | docker compose -f deploy/docker-compose.yml --env-file deploy/.env exec -T postgres psql -U pt patient_tracker
```

**Thử tải:** xem [loadtest/README.md](loadtest/README.md). Với 500 người nhà cùng theo dõi một ca: không request nào lỗi,
thông báo tới người nhà p95 1,04 s.

## Lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `pnpm build` | Build toàn bộ |
| `pnpm test` | Unit test (Jest) |
| `pnpm --filter @pt/api test:e2e` | Test API với CSDL test riêng (`DATABASE_URL_TEST`, tự migrate + seed) |
| `pnpm --filter @pt/api test:cov:all` | Coverage gộp unit + e2e (báo cáo HTML ở `apps/api/coverage`) |
| `pnpm test:ui` | Kiểm thử giao diện + chụp ảnh minh chứng (Playwright, xem [e2e/README.md](e2e/README.md)) |
| `pnpm --filter @pt/api prisma:seed-demo` | Nạp dữ liệu demo cho buổi báo cáo |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Mở Prisma Studio xem dữ liệu |

## Tài liệu

- [Báo cáo Word](docs/bao-cao/Bao-cao-CDTN2.docx) (bản PDF: [Bao-cao-CDTN2.pdf](docs/bao-cao/Bao-cao-CDTN2.pdf)): 8 chương, có ảnh minh chứng và số liệu; sơ đồ ở docs/bao-cao/hinh
- [Quản lý dự án (Excel)](docs/quan-ly/Quan-ly-du-an.xlsx): product backlog, kế hoạch sprint, nhật ký buổi học, nhật ký công việc, thành viên
- [Kết quả kiểm thử (Excel)](docs/kiem-thu/Ket-qua-kiem-thu.xlsx): test case, bug log, tổng hợp; ảnh minh chứng để trong `docs/kiem-thu/anh/`
- Tài liệu dự án gốc và 10 bài giảng nằm ở thư mục gốc. Các file này chỉ để local và không đưa lên git.
