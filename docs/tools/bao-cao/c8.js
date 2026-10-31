const { chapterTitle, unnumbered, h2, p, bullets } = require('./lib');

module.exports = () => [
  chapterTitle('Kết luận và hướng phát triển'),
  h2('8.1. Kết quả đạt được'),
  ...bullets([
    'Hoàn thành 13/14 yêu cầu chức năng (toàn bộ yêu cầu ưu tiên Cao và Trung bình); FR-14 (SMS) thuộc hướng mở rộng.',
    'Chạy trọn vẹn buổi trình diễn theo tiêu chí MVP: tạo ca, đăng ký người nhà, người nhà vào xem, đổi đủ 5 trạng thái, người nhà nhận cập nhật ở mỗi bước.',
    'Đạt các chỉ tiêu hiệu năng: thông báo tới người nhà p95 1,04 s và màn hình trạng thái p95 79 ms với 500 người nhà cùng theo dõi, không request nào lỗi.',
    '112 test tự động (coverage 94% statements) và 22 kịch bản giao diện; 55/55 test case đạt, 18 lỗi phát hiện đều đã sửa.',
    'Đóng gói triển khai bằng Docker kèm nginx và sao lưu tự động, chạy được trên máy bất kỳ.',
  ]),
  h2('8.2. Hạn chế'),
  ...bullets([
    'Trên iPhone, chuông báo kết thúc chỉ reo lặp khi ứng dụng đang mở; khi ứng dụng đóng chỉ có âm thông báo mặc định của máy.',
    'Chưa thử nghiệm với người dùng thật tại bệnh viện; chưa tích hợp hệ thống thông tin bệnh viện (HIS), dữ liệu nhập tay.',
    'Một số thành phần lưu trong bộ nhớ nên chưa chạy được nhiều instance API.',
  ]),
  h2('8.3. Hướng phát triển'),
  ...bullets([
    'Mở rộng sang toàn bộ hành trình điều trị: tiếp nhận, khám, xét nghiệm, nhập viện, chuyển phòng, xuất viện (danh mục trạng thái đã thiết kế theo quy trình nên mở rộng không phải đổi cấu trúc CSDL).',
    'Màn hình TV công cộng hiển thị mã ca ẩn danh, chạy song song với ứng dụng.',
    'Một bệnh nhân cấp quyền cho nhiều người nhà với các mức quyền khác nhau.',
    'Dashboard thống kê cho bệnh viện: số ca đang thực hiện, đã hoàn tất, phòng đang dùng.',
    'Thông báo SMS cho người nhà không dùng điện thoại thông minh; dự đoán thời gian chờ từ dữ liệu lịch sử.',
    'Chuyển bộ đếm và kênh sự kiện sang Redis để chạy nhiều instance; tích hợp HIS.',
  ]),
  unnumbered('Tài liệu tham khảo'),
  ...[
    '[1] Nhóm thực hiện, “Tài liệu dự án: Hệ thống Theo dõi và Thông báo tình trạng bệnh nhân”, 10/2026.',
    '[2] Nguyễn Văn Trung, Bài giảng Chuyên đề tốt nghiệp 2, buổi 1–10, Khoa CNTT, Trường Đại học Văn Lang, 2026.',
    '[3] NestJS Documentation, https://docs.nestjs.com',
    '[4] Next.js Documentation, https://nextjs.org/docs',
    '[5] Prisma ORM Documentation, https://www.prisma.io/docs',
    '[6] PostgreSQL 16 Documentation, https://www.postgresql.org/docs/16/',
    '[7] Firebase Cloud Messaging, https://firebase.google.com/docs/cloud-messaging',
    '[8] MDN Web Docs, Server-sent events, https://developer.mozilla.org/docs/Web/API/Server-sent_events',
    '[9] Grafana k6 Documentation, https://grafana.com/docs/k6/latest/',
    '[10] Playwright Documentation, https://playwright.dev/docs/intro',
    '[11] OWASP Authentication Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  ].map((t) => p(t, { noIndent: true, align: 'left' })),
  unnumbered('Phụ lục'),
  ...bullets([
    '**Mã nguồn:** https://github.com/ThienBao19/CDTN2 (README hướng dẫn cài đặt và triển khai).',
    '**Kết quả kiểm thử, Bug log, ảnh minh chứng:** docs/kiem-thu/Ket-qua-kiem-thu.xlsx và docs/kiem-thu/anh/.',
    '**Backlog, kế hoạch sprint, nhật ký thực hiện:** docs/quan-ly/Quan-ly-du-an.xlsx.',
    '**Kịch bản thử tải:** loadtest/; **kịch bản kiểm thử giao diện:** e2e/.',
  ]),
];
