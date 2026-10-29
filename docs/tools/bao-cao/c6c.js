const { h2, p, bullets, tbl } = require('./lib');

module.exports = () => [
  h2('6.5. Lỗi phát hiện và xử lý'),
  p('Trong quá trình kiểm thử, nhóm ghi nhận 17 lỗi vào Bug log; tất cả đã được sửa và có test hồi quy.'),
  ...tbl('Lỗi đã phát hiện và sửa', ['Mã', 'Lỗi', 'Mức độ', 'Phát hiện nhờ'], [
    ['BUG-01', 'Giới hạn đăng nhập né được bằng X-Forwarded-For giả', 'Cao', 'Rà soát bảo mật'],
    ['BUG-02', 'Liên kết được với ca đã hoàn tất (nay: không đăng ký người nhà cho ca đã kết thúc)', 'Cao', 'Đối chiếu mục 7 tài liệu'],
    ['BUG-03', 'Liên kết không hết hiệu lực sau khi ca kết thúc', 'Trung bình', 'Đối chiếu mục 7'],
    ['BUG-04', 'Đổi mật khẩu/vai trò không thu hồi phiên cũ', 'Cao', 'Rà soát bảo mật'],
    ['BUG-05', 'Cookie Secure cứng theo môi trường; thời hạn cookie lệch JWT', 'Trung bình', 'Chuẩn bị triển khai'],
    ['BUG-06', 'Hết phiên khi mở link QR làm mất mã (luồng mã/QR đã được thay ngày 17/10)', 'Trung bình', 'Rà soát luồng QR'],
    ['BUG-07', 'Chuyển hướng sau đăng nhập sai vai trò gây lỗi 403', 'Thấp', 'Rà soát luồng'],
    ['BUG-08', 'Không ghi nhật ký đăng nhập sai', 'Thấp', 'Đối chiếu NFR-10'],
    ['BUG-09', 'API ưu tiên cookie hơn header Authorization', 'Trung bình', 'Thử tải k6'],
    ['BUG-10', 'Proxy Next.js lỗi khi 100 người dùng đồng thời', 'Cao', 'Thử tải k6'],
    ['BUG-11', 'Token giả né được giới hạn tần suất', 'Cao', 'Kiểm tra kết quả k6'],
    ['BUG-12', 'Bản sao lưu đầu tiên rỗng', 'Trung bình', 'Thử khôi phục'],
    ['BUG-13', 'Thiếu màn hình sửa giờ/phòng của ca (FR-04)', 'Trung bình', 'Viết kịch bản Playwright'],
    ['BUG-14', 'Nhật ký thiếu nhãn cho hành động mới', 'Thấp', 'Viết kịch bản Playwright'],
    ['BUG-15', '“Cập nhật lúc” lấy sai thời điểm', 'Thấp', 'Xem ảnh minh chứng'],
    ['BUG-16', 'Sao lưu báo thành công dù pg_dump lỗi', 'Trung bình', 'Chụp minh chứng sao lưu'],
    ['BUG-17', 'Người nhà thoát app rồi mở lại từ màn hình chính bị bắt nhập lại thông tin', 'Cao', 'Thử trên iPhone thật'],
  ], [1.2, 5.2, 1.6, 2.6]),
  p('Phân tích: phần lớn lỗi nghiêm trọng không nằm ở luồng chính (đã được kiểm thử kỹ từ Sprint 1) mà ở **ranh giới giữa các thành phần**: giữa web và API (proxy, cookie, địa chỉ IP), giữa ứng dụng và môi trường triển khai (Docker, sao lưu). Các lỗi này chỉ lộ ra khi chạy hệ thống như thật: thử tải, triển khai Docker và thử khôi phục dữ liệu. Đây là bài học chính của nhóm về kiểm thử.'),
  h2('6.6. Hạn chế đã biết'),
  ...bullets([
    'iPhone không cho trang web rung máy; khi ứng dụng đang đóng, hệ điều hành chỉ phát âm thông báo mặc định một lần, chuông lặp chỉ có khi ứng dụng đang mở. Android rung dài và giữ thông báo tới khi người dùng tắt.',
    'Bộ đếm nhập sai mã và kênh sự kiện SSE lưu trong bộ nhớ: đúng khi chạy một instance API; chạy nhiều instance cần chuyển sang Redis.',
    'Đăng xuất chỉ xóa phiên trên thiết bị đó; muốn thu hồi mọi phiên thì đổi mật khẩu.',
    'Giới hạn đăng nhập theo tài khoản có thể bị lợi dụng để làm một tài khoản bị chặn đăng nhập trong 1 phút.',
    'Người nhà vào xem không cần mật khẩu (theo yêu cầu): ai biết đúng số điện thoại, họ tên người nhà và họ tên bệnh nhân đã được đăng ký thì xem được. Rủi ro được giảm bằng việc chỉ người được nhân viên đăng ký mới vào được, khóa sau 5 lần sai, phiên hết khi ca kết thúc và nhật ký truy cập.',
  ]),
];
