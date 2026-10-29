const { chapterTitle, h2, p, tbl, img } = require('./lib');

module.exports = () => [
  chapterTitle('Kiểm thử và đánh giá'),
  p('Kiểm thử tập trung vào ba rủi ro lớn nhất của đề tài: đổi trạng thái sai thứ tự, lộ thông tin cho người không có quyền, và thông báo không đến hoặc đến chậm. Toàn bộ kiểm thử tự động chạy lại được bằng một lệnh và được thực hiện lại ở cuối mỗi sprint.'),
  h2('6.1. Chiến lược kiểm thử'),
  ...tbl('Các mức kiểm thử', ['Mức', 'Công cụ', 'Phạm vi', 'Số lượng'], [
    ['Unit', 'Jest', 'Quy tắc chuyển trạng thái, so khớp họ tên bỏ dấu, chuẩn hóa SĐT, khóa nhập sai, phân quyền, giới hạn tần suất, gửi push và thử lại', '55 test'],
    ['API e2e (tích hợp)', 'Jest + Supertest, CSDL test riêng', 'Toàn bộ API với PostgreSQL thật: đăng nhập nhân viên, người nhà vào xem, ca, trạng thái, thông báo, SSE, quản trị', '56 test'],
    ['Giao diện', 'Playwright (Chromium)', 'Luồng chính và trường hợp lỗi trên bản triển khai Docker; chụp ảnh minh chứng', '22 kịch bản'],
    ['Hiệu năng', 'k6', '100 và 500 người nhà cùng theo dõi một ca (TC-10, NFR-01–03)', '2 lần chạy'],
    ['Thủ công', 'Trình duyệt, Docker', 'Triển khai, sao lưu/khôi phục, các nhánh lỗi của script, thông báo đẩy trên iPhone thật', '5 kịch bản'],
  ], [1.8, 2.4, 5, 1.4]),
  h2('6.2. Kết quả tổng hợp'),
  p('Tổng cộng **54 test case** được đặc tả trong file Excel kết quả kiểm thử, **cả 54 đều đạt**. TC-31 (thông báo đẩy FCM tới iPhone thật khi đang tắt màn hình) được kiểm thử thủ công ngày 29/10/2026 với dự án Firebase của nhóm. Mỗi test case đạt đều có ảnh minh chứng trong thư mục docs/kiem-thu/anh. Độ bao phủ mã của API khi chạy gộp unit và e2e (báo cáo chi tiết từng file: ảnh KQ-03-coverage.png):'),
  ...tbl('Độ bao phủ mã (coverage) của API', ['Chỉ số', 'Kết quả', 'Ngưỡng'], [
    ['Statements', '94,48% (925/979)', '≥ 80%'],
    ['Lines', '95,09% (814/856)', '≥ 80%'],
    ['Functions', '91,2% (166/182)', '≥ 80%'],
    ['Branches', '77,23% (519/672)', '—'],
  ], [3, 4, 2]),
  h2('6.3. Kết quả các test case tiêu biểu'),
  ...tbl('Kịch bản kiểm thử theo tài liệu dự án (TC-01 đến TC-10)', ['Mã', 'Kịch bản', 'Kết quả mong đợi', 'Kết quả'], [
    ['TC-01', 'Chuyển trạng thái đúng thứ tự', 'Lưu, có lịch sử, người nhà nhận thông báo', 'Đạt'],
    ['TC-02', 'Bỏ qua một bước trạng thái', 'Bị từ chối, lỗi rõ ràng', 'Đạt'],
    ['TC-03', 'Người nhà nhập đúng SĐT, họ tên, tên bệnh nhân', 'Vào xem, thấy bệnh nhân trong danh sách', 'Đạt'],
    ['TC-04', 'Sai tên bệnh nhân / họ tên / SĐT chưa đăng ký', 'Báo lỗi, không vào được', 'Đạt'],
    ['TC-05', 'Nhập sai nhiều lần', 'Tạm khóa theo số điện thoại', 'Đạt (khóa 15 phút sau 5 lần)'],
    ['TC-06', 'Gọi API xem ca chưa liên kết', 'Bị từ chối, không lộ dữ liệu', 'Đạt (404/403)'],
    ['TC-07', 'Người nhà gọi API cập nhật trạng thái', 'Bị từ chối do sai vai trò', 'Đạt (403)'],
    ['TC-08', 'Thu hồi liên kết', 'Không nhận thông báo, không xem được ca', 'Đạt'],
    ['TC-09', 'Thiết bị offline khi trạng thái đổi', 'Nhận trạng thái mới khi có mạng', 'Đạt (phần trong ứng dụng)'],
    ['TC-10', '100 người nhà theo dõi cùng một ca', 'Tất cả nhận thông báo < 5 giây', 'Đạt (p95 697 ms)'],
  ], [1.1, 3.4, 3.6, 2.3]),
  ...img('kiem-thu/anh/TC-05.png', 'TC-05: nhập sai nhiều lần bị tạm khóa', 6.5),
];
