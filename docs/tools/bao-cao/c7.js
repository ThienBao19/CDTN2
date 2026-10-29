const { chapterTitle, h2, p, bullets, tbl, img } = require('./lib');

module.exports = () => [
  chapterTitle('Triển khai'),
  h2('7.1. Đóng gói bằng Docker'),
  p('Toàn bộ hệ thống chạy bằng Docker Compose với một lệnh, không phụ thuộc máy của lập trình viên. API và web được build thành image riêng (web dùng chế độ standalone của Next.js); migration CSDL tự chạy mỗi khi API khởi động và không xóa dữ liệu.'),
  ...tbl('Các container khi triển khai', ['Container', 'Vai trò'], [
    ['nginx', 'Cổng vào duy nhất (mặc định cổng 8080): /api vào API, còn lại vào web; tắt đệm cho kênh SSE; ghi IP thật của người dùng'],
    ['web', 'Next.js: giao diện người nhà, nhân viên, quản trị'],
    ['api', 'NestJS: REST API, SSE, gửi push; kiểm tra sức khỏe qua /api/health'],
    ['postgres', 'PostgreSQL 16, dữ liệu lưu trong volume'],
    ['backup', 'pg_dump mỗi ngày vào thư mục backups/, giữ 7 ngày; chờ CSDL sẵn sàng, báo lỗi khi sao lưu thất bại'],
  ], [2, 8]),
  ...img('kiem-thu/anh/KQ-06-trien-khai-docker.png', 'Các container của bản triển khai demo', 14),
  h2('7.2. Hướng dẫn chạy'),
  ...bullets([
    'Sao chép deploy/.env.example thành deploy/.env, điền mật khẩu CSDL, hai khóa bí mật (mỗi khóa ít nhất 32 ký tự) và mật khẩu tài khoản demo.',
    'Chạy: docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build',
    'Nạp dữ liệu: docker compose ... exec api npx prisma db seed (thêm npx ts-node prisma/seed-demo.ts nếu cần dữ liệu demo).',
    'Mở http://localhost:8080. Demo trên điện thoại cùng mạng LAN: mở http://<IP máy>:8080 với COOKIE_SECURE=false.',
  ]),
  p('Tài khoản có sẵn: admin@benhvien.test (quản trị viên) và nhanvien1@benhvien.test, nhanvien2@benhvien.test, nhanvien3@benhvien.test (nhân viên y tế); mật khẩu là giá trị SEED_PASSWORD trong file cấu hình, không ghi trong mã nguồn. Người nhà không có tài khoản; dữ liệu demo có sẵn người nhà số 0901234567 – Nguyễn Thị Mai, vào xem bằng họ tên bệnh nhân Nguyễn Văn An hoặc Trần Thị Bích.'),
  h2('7.3. Sao lưu và khôi phục'),
  p('Nhóm đã thử khôi phục bản sao lưu vào một CSDL tạm: đủ 12 bảng cùng toàn bộ tài khoản, ca phẫu thuật và lịch sử. Nhánh lỗi cũng được kiểm tra: khi pg_dump thất bại, script báo “Sao lưu thất bại” và không để lại file rỗng.'),
  ...img('kiem-thu/anh/KQ-07-sao-luu-khoi-phuc.png', 'Sao lưu tự động và thử khôi phục', 14),
  h2('7.4. Phương án dự phòng khi báo cáo'),
  ...bullets([
    'Chạy demo trên máy cá nhân bằng Docker (không cần Internet); có sẵn dữ liệu demo.',
    'Bộ ảnh minh chứng và video demo dự phòng (nhóm quay từ luồng trình diễn của Playwright).',
    'Mã nguồn trên GitHub và bản sao trên USB.',
  ]),
];
