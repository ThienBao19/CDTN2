const { chapterTitle, h2, p, bullets, tbl } = require('./lib');

module.exports = () => [
  chapterTitle('Mở đầu'),
  h2('1.1. Lý do chọn đề tài'),
  p('Tại các bệnh viện, tình trạng ca phẫu thuật thường được hiển thị trên một số màn hình TV chung đặt trước khu phẫu thuật. Số màn hình có hạn, trong khi ở bệnh viện lớn lượng người nhà rất đông, dẫn đến ùn tắc và mất trật tự tại khu vực chờ. Người nhà phải đứng chờ nhiều giờ hoặc liên tục quay lại chỉ để biết một trạng thái đơn giản như ca mổ đã bắt đầu hay đã xong; nhân viên y tế cũng phải trả lời lặp đi lặp lại cùng một câu hỏi.'),
  p('Hầu hết người nhà đều có điện thoại thông minh. Nếu thông tin trạng thái được đưa trực tiếp tới điện thoại của đúng người được phép theo dõi, người nhà có thể rời khu vực chờ mà vẫn nắm được tình hình, còn bệnh viện giảm được áp lực và giữ trật tự. Đó là lý do nhóm chọn đề tài **“Hệ thống Theo dõi và Thông báo tình trạng bệnh nhân”**.'),
  h2('1.2. Mục tiêu'),
  ...bullets([
    '**Cá nhân hóa thông tin:** mỗi người nhà chỉ xem được bệnh nhân mình được bệnh viện cấp quyền.',
    '**Cập nhật tức thời:** người nhà nhận thông báo ngay khi trạng thái thay đổi (mục tiêu dưới 5 giây).',
    '**Giảm tập trung tại khu vực chờ** và giảm số câu hỏi lặp lại cho nhân viên.',
    '**Bảo vệ quyền riêng tư:** chỉ người nhà được nhân viên đăng ký mới xem được, không tra cứu tự do, nội dung thông báo kín đáo.',
    '**Nền tảng mở rộng được** sang toàn bộ hành trình điều trị (khám, xét nghiệm, nhập viện).',
  ]),
  h2('1.3. Phạm vi'),
  p('Phiên bản đầu (MVP) tập trung vào luồng theo dõi **ca phẫu thuật**, chạy trọn vẹn từ tiếp nhận đến thông báo cho người nhà. Các hướng còn lại được đưa vào giai đoạn sau.'),
  ...tbl('Phạm vi MVP và hướng mở rộng', ['Trong phạm vi MVP', 'Ngoài phạm vi (hướng mở rộng)'], [
    ['Đăng nhập và phân quyền theo vai trò', 'Theo dõi toàn bộ hành trình điều trị'],
    ['Quản lý bệnh nhân và ca phẫu thuật', 'Hệ thống xếp hàng, bản đồ chỉ đường'],
    ['Nhân viên đăng ký người nhà được theo dõi', 'Nhiều người nhà với các mức quyền khác nhau'],
    ['Cập nhật trạng thái theo 5 giai đoạn', 'Dashboard thống kê cho bệnh viện'],
    ['Thông báo đẩy và cập nhật thời gian thực', 'Thông báo SMS qua SMS Gateway'],
    ['Lịch sử trạng thái, nhật ký truy cập, trang quản trị', 'Dự đoán thời gian chờ bằng AI'],
  ], [1, 1]),
  h2('1.4. Đối tượng sử dụng'),
  ...bullets([
    '**Người nhà bệnh nhân:** không cần tài khoản; vào xem bằng số điện thoại, họ tên mình và họ tên bệnh nhân; xem trạng thái, lịch sử và nhận thông báo.',
    '**Nhân viên y tế:** tạo bệnh nhân và ca, cập nhật trạng thái, đăng ký số điện thoại và họ tên người nhà được theo dõi.',
    '**Quản trị viên bệnh viện:** quản lý tài khoản, phòng, danh mục trạng thái và xem nhật ký truy cập.',
  ]),
  h2('1.5. Phương pháp thực hiện'),
  p('Đề tài áp dụng quy trình phát triển sản phẩm CNTT gồm 7 bước của học phần: **Discovery** (phân tích yêu cầu) → **Planning** (lập kế hoạch) → **Design** (thiết kế) → **Build** (xây dựng) → **Test** (kiểm thử) → **Deploy** (triển khai) → **Report** (báo cáo). Phần xây dựng được tổ chức theo Scrum rút gọn với 4 sprint; mỗi sprint kết thúc bằng sản phẩm chạy được, có kiểm thử tự động và được ghi vào nhật ký thực hiện đề tài.'),
  h2('1.6. Bố cục báo cáo'),
  p('Ngoài phần mở đầu, báo cáo gồm: Chương 2 phân tích yêu cầu; Chương 3 kế hoạch dự án; Chương 4 thiết kế hệ thống; Chương 5 xây dựng sản phẩm; Chương 6 kiểm thử và đánh giá; Chương 7 triển khai; Chương 8 kết luận và hướng phát triển. Bố cục bám theo đúng thứ tự các bước của quy trình phát triển sản phẩm.'),
];
