const { chapterTitle, h2, p, bullets, tbl, img } = require('./lib');

module.exports = () => [
  chapterTitle('Thiết kế hệ thống'),
  h2('4.1. Kiến trúc tổng thể'),
  p('Hệ thống theo kiến trúc client–server với một backend trung tâm phục vụ cả ba nhóm người dùng. Khi triển khai, **nginx** là cổng vào duy nhất: yêu cầu tới “/api” đi thẳng vào API, phần còn lại vào ứng dụng web. API ghi dữ liệu vào PostgreSQL, đẩy cập nhật tức thời qua kênh SSE tới màn hình đang mở và nhờ Firebase Cloud Messaging gửi thông báo tới điện thoại người nhà. Một container riêng sao lưu CSDL hằng ngày.'),
  ...img('bao-cao/hinh/kien-truc.png', 'Kiến trúc triển khai của hệ thống'),
  h2('4.2. Lựa chọn công nghệ'),
  ...tbl('Công nghệ sử dụng và lý do lựa chọn', ['Thành phần', 'Công nghệ', 'Lý do'], [
    ['Backend', 'NestJS 11 (Node.js 24, TypeScript)', 'Chia module rõ ràng (xác thực, ca, trạng thái, liên kết, thông báo); guard/pipe có sẵn cho phân quyền và kiểm tra dữ liệu đầu vào'],
    ['CSDL', 'PostgreSQL 16 + Prisma 6', 'Dữ liệu quan hệ, ràng buộc chặt; giao dịch đảm bảo trạng thái hiện tại và lịch sử luôn nhất quán; migration có phiên bản'],
    ['Web nhân viên, quản trị, người nhà', 'Next.js 15, React 19, Tailwind 4', 'Một mã nguồn cho cả 3 giao diện; web responsive + PWA thay cho app di động riêng để kịp thời gian (NFR-09 cho phép)'],
    ['Thời gian thực', 'Server-Sent Events', 'Đơn giản hơn WebSocket cho luồng một chiều máy chủ → trình duyệt; tự kết nối lại; đi qua proxy HTTP thông thường'],
    ['Thông báo đẩy', 'Firebase Cloud Messaging', 'Miễn phí, hỗ trợ Android, iOS và trình duyệt'],
    ['Dùng chung', 'Monorepo pnpm + Turborepo', 'API và web dùng chung hằng số trạng thái, vai trò; build và test một lệnh'],
    ['Triển khai', 'Docker Compose + nginx', 'Chạy trọn bộ trên máy bất kỳ bằng một lệnh, không phụ thuộc máy lập trình viên'],
    ['Kiểm thử', 'Jest, Supertest, Playwright, k6', 'Unit, API e2e trên CSDL thật, giao diện trên trình duyệt thật, thử tải'],
  ], [2.2, 3, 5.6]),
  h2('4.3. Tổ chức mã nguồn'),
  ...bullets([
    '**apps/api** – NestJS: các module auth, patients, surgeries (kèm đổi trạng thái), family (người nhà vào xem, nhân viên đăng ký người nhà), links, my (API cho người nhà), notifications, events (SSE), devices, admin, audit; khoảng 3 900 dòng mã và 1 200 dòng test e2e.',
    '**apps/web** – Next.js: trang người nhà (/nguoi-nha, /theo-doi, /thong-bao, /cai-dat), nhân viên (/staff), quản trị (/admin); khoảng 2 300 dòng.',
    '**packages/shared** – hằng số dùng chung (vai trò, 5 trạng thái mặc định).',
    '**deploy/** – docker-compose, cấu hình nginx, script sao lưu; **loadtest/** – kịch bản k6; **e2e/** – kịch bản Playwright.',
  ]),
  p('Nguyên tắc kiến trúc: mọi kiểm tra quyền đặt ở backend (guard toàn cục, mọi API mặc định yêu cầu đăng nhập); danh mục trạng thái lưu trong CSDL thay vì cố định trong mã để sau này thêm quy trình khám, xét nghiệm, nhập viện mà không đổi cấu trúc; quy tắc chuyển trạng thái viết thành hàm thuần để kiểm thử độc lập.'),
];
