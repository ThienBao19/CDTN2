# Tài liệu API

Tất cả API nằm dưới tiền tố `/api` (qua nginx: `http://<máy chủ>:8080/api`, chạy dev: `http://localhost:4000/api`).
Dữ liệu gửi và nhận dạng JSON. Lỗi trả về `{ "statusCode", "message", "error" }` với `message` tiếng Việt.

## Xác thực và vai trò

| Vai trò | Cách vào hệ thống | Mật khẩu |
|---|---|---|
| Nhân viên y tế, quản trị viên | `POST /auth/login` bằng email + mật khẩu | Có (argon2) |
| Người nhà bệnh nhân | `POST /auth/family-access` bằng SĐT + họ tên mình + họ tên bệnh nhân | **Không**, không cần email, không cần xác nhận |

- Đăng nhập thành công: cookie `pt_token` (httpOnly, SameSite=Strict) cho web, kèm `accessToken` trong body để dùng header `Authorization: Bearer <token>` (Postman, ứng dụng khác). Header được ưu tiên hơn cookie.
- Người nhà **không tự đăng ký**: nhân viên đăng ký SĐT + họ tên người nhà vào từng ca. Người nhà nhập đúng 3 thông tin (không phân biệt hoa thường, có dấu hay không dấu) thì được vào; sai 5 lần trong 15 phút thì khóa 15 phút theo số điện thoại.
- Phiên người nhà kéo dài tới khi ca kết thúc: tự hết khi không còn liên kết hiệu lực (nhân viên gỡ quyền, hoặc 24 giờ sau khi ca hoàn tất/bị hủy).
- Tài khoản seed: `admin@benhvien.test` (quản trị), `nhanvien1@benhvien.test`, `nhanvien2@benhvien.test`, `nhanvien3@benhvien.test` (nhân viên y tế); mật khẩu là `SEED_PASSWORD` trong file `.env`.

### POST /auth/login — nhân viên, quản trị viên

```json
{ "identifier": "nhanvien1@benhvien.test", "password": "••••••••" }
```

200 → `{ "user": { "id", "fullName", "email", "phone", "role": "STAFF" }, "accessToken": "…" }`
401 sai thông tin (kể cả khi dùng số điện thoại người nhà) · 403 tài khoản bị khóa · 429 quá 10 lần/phút cho một tài khoản.

### POST /auth/family-access — người nhà

```json
{ "phone": "0901234567", "fullName": "Nguyễn Thị Mai", "patientName": "Nguyễn Văn An" }
```

200 → `{ "user": { "id", "fullName", "phone", "role": "FAMILY" }, "accessToken": "…" }`
401 “Thông tin chưa khớp với đăng ký của bệnh viện…” · 429 nhập sai quá nhiều lần.
Chấp nhận `0901 234 567`, `+84 901 234 567`; tên gõ không dấu (`nguyen van an`) cũng khớp.

### Khác

| Phương thức | Đường dẫn | Mô tả | Vai trò |
|---|---|---|---|
| POST | `/auth/logout` | Xóa cookie phiên | Tất cả |
| GET | `/auth/me` | Người dùng hiện tại | Tất cả |
| PUT | `/auth/password` | Đổi mật khẩu `{ currentPassword, newPassword }`; thu hồi mọi phiên khác, trả `accessToken` mới | Nhân viên, Quản trị |

## Người nhà của ca (nhân viên đăng ký)

| Phương thức | Đường dẫn | Mô tả | Vai trò |
|---|---|---|---|
| POST | `/surgeries/{id}/family-contacts` | Đăng ký người nhà `{ phone, fullName }` | Nhân viên, Quản trị |
| GET | `/surgeries/{id}/family-contacts` | Danh sách người nhà của ca (`id`, `phone`, `fullName`, `status`, `linkedAt`, `addedBy`) | Nhân viên, Quản trị |
| DELETE | `/links/{id}` | Gỡ quyền theo dõi (`id` lấy từ danh sách trên); người nhà cũng tự ngừng theo dõi được | Nhân viên, Quản trị, Người nhà (của mình) |

POST trả 201 `{ id, phone, fullName, status, linkedAt }` · 400 SĐT không hợp lệ · 409 ca đã hủy/kết thúc hoặc SĐT thuộc tài khoản nhân viên.
Một SĐT được đăng ký cho nhiều ca thì người nhà thấy tất cả các ca đó sau một lần vào.

## Bệnh nhân và ca phẫu thuật (nhân viên, quản trị)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/patients` | Tạo bệnh nhân `{ patientCode, fullName, dateOfBirth: "YYYY-MM-DD", gender: MALE\|FEMALE\|OTHER }` |
| GET | `/patients?q=` | Tìm theo mã hoặc tên (chỉ nhân viên) |
| GET / PUT | `/patients/{id}` | Xem, sửa (không đổi mã) |
| POST | `/surgeries` | Tạo ca `{ patientId, title, scheduledAt (ISO), roomId? }` → trạng thái “Đã tiếp nhận” |
| GET | `/surgeries?date=YYYY-MM-DD&roomId=&status=` | Danh sách ca, ngày theo giờ Việt Nam |
| GET / PUT | `/surgeries/{id}` | Chi tiết; sửa tên, giờ, phòng (đổi giờ/phòng sẽ báo người nhà) |
| POST | `/surgeries/{id}/cancel` | Hủy ca `{ reason }` |
| POST | `/surgeries/{id}/status` | Đổi trạng thái `{ statusCode, note?, override? }` — **chỉ nhân viên**; chỉ bước kế tiếp, quay lui/bỏ bước cần `override: true` + `note` |
| GET | `/surgeries/{id}/history` | Lịch sử trạng thái (người nhà chỉ thấy tên trạng thái và thời điểm) |
| GET | `/rooms`, `/statuses` | Danh mục phòng, trạng thái |

## API của người nhà

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/my/surgeries` | Các ca đang theo dõi (tên bệnh nhân đã ẩn bớt, vd “N. V. An”) |
| GET | `/my/surgeries/{id}` | Chi tiết + lịch sử; 404 nếu không được đăng ký cho ca này |
| GET | `/my/notifications` | `{ items, unreadCount }` |
| POST | `/my/notifications/{id}/read`, `/my/notifications/read-all` | Đánh dấu đã đọc |
| POST / DELETE | `/devices` | Đăng ký/xóa token nhận push FCM `{ token, platform: WEB\|ANDROID\|IOS }` |

## Thời gian thực

`GET /events` (Server-Sent Events, cần đăng nhập): sự kiện `surgery.updated` `{ surgeryId }` và `notification.created` `{ userId, surgeryId }`. Người nhà chỉ nhận sự kiện của ca mình được đăng ký.

## Quản trị (chỉ quản trị viên)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET / POST | `/admin/users` | Danh sách (`?role=&q=`); tạo tài khoản `{ fullName, email, phone?, password, role: STAFF\|ADMIN }` |
| PATCH | `/admin/users/{id}` | Đổi tên, vai trò, khóa/mở khóa (khóa hoặc đổi vai trò thu hồi phiên đang mở) |
| GET / POST / PUT | `/admin/rooms`, `/admin/rooms/{id}` | Quản lý phòng |
| GET / PUT | `/admin/statuses`, `/admin/statuses/{id}` | Sửa tên hiển thị và nội dung thông báo của trạng thái |
| GET | `/admin/audit-logs?userId=&action=&from=&to=&page=&pageSize=` | Nhật ký truy cập (có `FAMILY_ACCESS`, `FAMILY_ACCESS_FAILED`, `ADD_FAMILY`, `LOGIN`, `LOGIN_FAILED`, …) |

## Khác

`GET /health` (công khai): `{ status, database }`.
Giới hạn tần suất mặc định 300 request/phút cho mỗi người dùng (`RATE_LIMIT`).
