# Backlog MVP — truy vết yêu cầu

Ưu tiên: **Cao** là bắt buộc cho MVP. Sprint ứng với lộ trình môn học: buổi 6 là Sprint 1, buổi 7 là Sprint 2.

| Mã | Yêu cầu | Ưu tiên | Module backend | Màn hình | Sprint | Kiểm thử |
|----|---------|---------|----------------|----------|--------|----------|
| FR-01 | Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu | Cao | `auth` | Đăng nhập/đăng ký | 1 | — |
| FR-02 | Phân quyền theo vai trò | Cao | `auth` (guard) | — | 1 | TC-06, TC-07 |
| FR-03 | Quản lý bệnh nhân | Cao | `patients` | Tạo bệnh nhân | 1 | — |
| FR-04 | Quản lý ca phẫu thuật | Cao | `surgeries` | Danh sách / tạo ca | 1 | — |
| FR-05 | Cập nhật trạng thái đúng thứ tự | Cao | `status` | Cập nhật trạng thái | 1 | TC-01, TC-02 |
| FR-06 | Mã theo dõi / QR | Cao | `tracking-codes` | Cấp mã theo dõi | 1 | TC-04, TC-05 |
| FR-07 | Liên kết người nhà | Cao | `links` | Liên kết bệnh nhân | 1 | TC-03, TC-04 |
| FR-08 | Theo dõi trạng thái | Cao | `my` + WebSocket/polling | Chi tiết trạng thái | 2 | TC-09 |
| FR-09 | Push Notification | Cao | `notifications` (FCM) | Thông báo | 2 | TC-01, TC-10 |
| FR-10 | Lịch sử trạng thái | Cao | `status` | Lịch sử | 1 | TC-01 |
| FR-11 | Nhật ký truy cập | Trung bình | `audit` | Nhật ký truy cập | 2 | — |
| FR-12 | Quản trị tài khoản, phòng, trạng thái | Trung bình | `admin` | Trang quản trị | 2 | — |
| FR-13 | Hủy liên kết | Trung bình | `links` | Cài đặt | 2 | TC-08 |
| FR-14 | Thông báo SMS | Thấp | — | — | Mở rộng | — |

## Sprint 1 — đã xong (15/10/2026)

- [x] FR-01 Đăng ký/đăng nhập/đăng xuất/đổi mật khẩu (JWT trong cookie httpOnly, argon2, giới hạn 10 lần đăng nhập/phút)
- [x] FR-02 Phân quyền: guard toàn cục, `@Roles`, kiểm tra lại tài khoản từ CSDL mỗi request
- [x] FR-03, FR-04 Bệnh nhân, ca phẫu thuật (lọc ngày/phòng/trạng thái, hủy ca có lý do)
- [x] FR-05, FR-10 Đổi trạng thái đúng thứ tự, điều chỉnh có lý do, chống cập nhật trùng, lịch sử chỉ thêm mới
- [x] FR-06 Mã theo dõi 8 ký tự (chỉ lưu HMAC), QR chứa link `/lien-ket?code=`, thu hồi, hết hạn 24h
- [x] FR-07 Liên kết người nhà, khóa 15 phút sau 5 lần sai
- [x] FR-08 (phần polling 10s) màn hình người nhà; FR-13 hủy liên kết; nhật ký truy cập cho các thao tác chính
- [x] Web: đăng nhập/đăng ký, người nhà (danh sách, liên kết, chi tiết), nhân viên (danh sách, tạo ca, chi tiết + QR)
- [x] Kiểm thử: 25 unit + 30 e2e test; [Kết quả kiểm thử](kiem-thu/Ket-qua-kiem-thu.xlsx)

**Còn lại cho Sprint 2:** FR-09 push FCM, WebSocket, FR-11 màn hình nhật ký, FR-12 trang quản trị, TC-09, TC-10.

## Đã có trong khung dự án

- [x] Monorepo pnpm + Turborepo, Docker Compose PostgreSQL
- [x] Prisma schema 11 bảng (mục 10) + migration `init`
- [x] Seed: 5 trạng thái, 3 phòng, 3 tài khoản demo
- [x] API NestJS: Prisma, ConfigModule, ValidationPipe, Helmet, CORS, `GET /api/health`
- [x] Web Next.js: trang chọn vai trò, thanh tiến trình 5 giai đoạn, PWA manifest
- [x] Unit test + e2e test cho health check
