const { chapterTitle, h2, p, bullets, tbl } = require('./lib');

module.exports = () => [
  chapterTitle('Kế hoạch dự án'),
  h2('3.1. Mô hình quản lý'),
  p('Nhóm áp dụng Scrum rút gọn: product backlog gồm các user story gắn mã yêu cầu (FR/NFR), mỗi sprint chọn một nhóm story có thể giao trọn vẹn, cuối sprint chạy lại toàn bộ kiểm thử tự động, cập nhật kết quả vào file Excel và nhật ký thực hiện đề tài. Mã nguồn quản lý trên GitHub, mỗi sprint là một commit có mô tả đầy đủ.'),
  ...bullets([
    '**Product backlog và kế hoạch sprint:** docs/quan-ly/Quan-ly-du-an.xlsx (18 hạng mục, có story point, tiêu chí chấp nhận, test case liên quan).',
    '**Nhật ký thực hiện đề tài:** sheet “Nhật ký buổi học” (10 buổi) và “Nhật ký công việc” (từng việc kèm mã commit).',
    '**Kết quả kiểm thử và Bug log:** docs/kiem-thu/Ket-qua-kiem-thu.xlsx.',
    '**Mã nguồn:** https://github.com/ThienBao19/CDTN2',
  ]),
  h2('3.2. Kế hoạch sprint'),
  ...tbl('Các sprint và kết quả', ['Sprint', 'Buổi', 'Mục tiêu', 'Kết quả chính'], [
    ['Sprint 0', '1–5', 'Khởi tạo dự án, thiết kế CSDL/API, môi trường phát triển', 'Monorepo, schema 11 bảng, Docker PostgreSQL, seed'],
    ['Sprint 1', '6', 'Luồng cốt lõi: xác thực, ca mổ, trạng thái, liên kết người nhà', '25 unit + 30 e2e test, chạy được luồng người nhà trên trình duyệt'],
    ['Sprint 2', '7 (giữa kỳ 2)', 'Thông báo, cập nhật thời gian thực, trang quản trị', 'SSE realtime 113 ms, FCM, nhật ký truy cập'],
    ['Sprint 3', '8–9', 'Kiểm thử, sửa lỗi, thử tải, triển khai Docker, sao lưu', '12 lỗi đã sửa, 500 người nhà 0 lỗi, Docker + nginx'],
    ['Sprint 4', '9–10', 'Minh chứng, báo cáo, slide; đổi cách người nhà vào xem', '19 kịch bản giao diện tự động, ảnh minh chứng, báo cáo; người nhà vào xem không cần tài khoản'],
  ], [1.2, 1.3, 4, 4]),
  h2('3.3. Phân công'),
  ...tbl('Phân công nhóm (nhóm điền họ tên)', ['Thành viên', 'Vai trò', 'Phụ trách chính'], [
    ['[Họ tên 1]', 'Nhóm trưởng', 'Backend/API, CSDL, điều phối, nộp bài'],
    ['[Họ tên 2]', 'Thành viên', 'Web nhân viên và trang quản trị'],
    ['[Họ tên 3]', 'Thành viên', 'Ứng dụng người nhà (PWA), thông báo'],
    ['[Họ tên 4]', 'Thành viên', 'Kiểm thử, tài liệu, báo cáo'],
  ], [2.5, 2, 5]),
  h2('3.4. Rủi ro và hướng xử lý'),
  ...tbl('Rủi ro chính', ['Rủi ro', 'Mức độ', 'Hướng xử lý đã áp dụng'], [
    ['Lộ thông tin bệnh nhân', 'Cao', 'Phân quyền ở máy chủ cho mọi API, chỉ người nhà được nhân viên đăng ký mới vào xem, khóa khi nhập sai nhiều lần, ẩn bớt tên, nhật ký truy cập'],
    ['Nhân viên cập nhật sai trạng thái', 'Cao', 'Nút lớn một chạm, bước xác nhận, chỉ cho bước kế tiếp; điều chỉnh phải có lý do và được đánh dấu'],
    ['Thông báo đến chậm hoặc mất', 'Trung bình', 'Kết hợp SSE (màn hình đang mở), push FCM có thử lại, danh sách thông báo xem lại khi có mạng'],
    ['Người nhà không quen dùng ứng dụng', 'Trung bình', 'Không cần tạo tài khoản hay nhớ mật khẩu: chỉ nhập số điện thoại, họ tên, tên bệnh nhân (gõ không dấu cũng được); chữ lớn'],
    ['Phạm vi đồ án quá rộng', 'Trung bình', 'Bám danh sách MVP, phần còn lại đưa vào hướng mở rộng'],
  ], [3, 1.4, 5.6]),
];
