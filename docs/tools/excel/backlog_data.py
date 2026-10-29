# (ID, FR, user story, tiêu chí chấp nhận, ưu tiên, điểm, sprint, trạng thái, test case)
DONE, DOING, TODO = "Hoàn thành", "Đang làm", "Chưa làm"
BACKLOG = [
  ("PB-01", "FR-01", "Là nhân viên y tế/quản trị viên, tôi muốn đăng nhập bằng email và mật khẩu; người nhà thì không cần tài khoản", "Chỉ nhân viên và quản trị đăng nhập; đổi mật khẩu thu hồi phiên cũ; seed sẵn 1 quản trị + 3 nhân viên; bỏ tự đăng ký", "Cao", 3, "Sprint 1", DONE, "TC-12, TC-13, TC-49, TC-50"),
  ("PB-02", "FR-02", "Là bệnh viện, tôi muốn mỗi vai trò chỉ làm được việc của mình để bảo vệ dữ liệu", "Kiểm tra quyền ở server cho mọi API; sai vai trò trả 403", "Cao", 3, "Sprint 1", DONE, "TC-07, TC-14"),
  ("PB-03", "FR-03", "Là nhân viên y tế, tôi muốn tạo và sửa hồ sơ bệnh nhân", "Tạo/sửa/tìm bệnh nhân; mã bệnh nhân không trùng", "Cao", 2, "Sprint 1", DONE, "TC-15"),
  ("PB-04", "FR-04", "Là nhân viên y tế, tôi muốn tạo ca mổ, gán phòng, giờ dự kiến và hủy ca khi cần", "Tạo ca ở trạng thái đầu; lọc theo ngày/phòng/trạng thái; hủy có lý do", "Cao", 3, "Sprint 1", DONE, "TC-16, TC-18"),
  ("PB-05", "FR-05", "Là nhân viên y tế, tôi muốn chuyển trạng thái ca bằng một nút để cập nhật nhanh", "Chỉ chuyển sang bước kế tiếp; quay lui/bỏ bước cần lý do; có xác nhận", "Cao", 5, "Sprint 1", DONE, "TC-01, TC-02, TC-17"),
  ("PB-06", "FR-06", "Là nhân viên y tế, tôi muốn đăng ký số điện thoại và họ tên người nhà vào ca để họ tự theo dõi", "Đăng ký, xem danh sách, gỡ quyền người nhà của ca; không đăng ký cho ca đã kết thúc; SĐT nhân viên bị từ chối (thay cho mã/QR từ 17/10/2026)", "Cao", 3, "Sprint 1", DONE, "TC-11, TC-19, TC-36"),
  ("PB-07", "FR-07", "Là người nhà, tôi muốn vào xem bằng SĐT, họ tên mình và họ tên bệnh nhân, không cần mật khẩu hay email", "Khớp với đăng ký của nhân viên thì vào xem; gõ không dấu vẫn được; sai 5 lần khóa 15 phút; phiên hết khi ca kết thúc", "Cao", 3, "Sprint 1", DONE, "TC-03, TC-04, TC-05, TC-22"),
  ("PB-08", "FR-08", "Là người nhà, tôi muốn thấy trạng thái hiện tại tự cập nhật", "Chi tiết ca hiện trạng thái + tiến trình; cập nhật không cần tải lại", "Cao", 3, "Sprint 1-2", DONE, "TC-21, TC-26"),
  ("PB-09", "FR-09", "Là người nhà, tôi muốn nhận thông báo đẩy khi trạng thái hoặc lịch thay đổi", "Push FCM tới thiết bị đã đăng ký; nội dung kín đáo; thử lại khi lỗi; lưu lịch sử gửi", "Cao", 8, "Sprint 2", DONE, "TC-01, TC-09, TC-23..25, TC-31, TC-53, TC-54"),
  ("PB-10", "FR-10", "Là người nhà/nhân viên, tôi muốn xem lịch sử các trạng thái đã qua", "Danh sách trạng thái kèm thời điểm, chỉ thêm mới", "Cao", 2, "Sprint 1", DONE, "TC-01"),
  ("PB-11", "FR-11", "Là quản trị viên, tôi muốn xem ai đã xem/sửa thông tin bệnh nhân", "Màn hình nhật ký lọc theo người dùng, thời gian, hành động", "Trung bình", 3, "Sprint 2", DONE, "TC-30"),
  ("PB-12", "FR-12", "Là quản trị viên, tôi muốn quản lý tài khoản nhân viên, phòng và danh mục trạng thái", "Tạo/khóa tài khoản, đổi vai trò; thêm/sửa phòng; sửa nội dung thông báo", "Trung bình", 5, "Sprint 2", DONE, "TC-27..29, TC-32"),
  ("PB-13", "FR-13", "Là người nhà/quản trị viên, tôi muốn hủy quyền theo dõi", "Hủy liên kết; sau đó không xem được ca và không nhận thông báo", "Trung bình", 2, "Sprint 1", DONE, "TC-08"),
  ("PB-14", "FR-14", "Là bệnh viện, tôi muốn gửi SMS cho người nhà không dùng ứng dụng", "Gửi qua SMS Gateway", "Thấp", 5, "Mở rộng", TODO, ""),
  ("PB-15", "NFR-01", "Là người nhà, tôi muốn nhận thông báo trong vòng 5 giây", "Đo độ trễ cập nhật → thông báo; k6 với 100 người theo dõi", "Cao", 3, "Sprint 3", DONE, "TC-10, TC-33"),
  ("PB-16", "NFR-09", "Là đội phát triển, tôi muốn triển khai bằng Docker để demo ổn định", "Dockerfile API + web, docker compose chạy trọn bộ", "Trung bình", 3, "Sprint 3", DONE, "TC-42, TC-43"),
  ("PB-17", "Kiểm thử", "Là đội phát triển, tôi muốn sửa các lỗi phát hiện khi kiểm thử để sản phẩm ổn định trước khi báo cáo", "12 lỗi trong Bug log đã sửa, có test hồi quy; coverage gộp ≥ 80%", "Cao", 5, "Sprint 3", DONE, "TC-34..TC-40, TC-44, TC-45"),
  ("PB-18", "Mục 7", "Là bệnh viện, tôi muốn phiên đăng nhập được thu hồi khi đổi mật khẩu/khóa và nhân viên tự đăng xuất khi bỏ máy", "Đổi mật khẩu/khóa/đổi vai trò thu hồi phiên; nhân viên không thao tác 30 phút tự đăng xuất", "Trung bình", 3, "Sprint 3", DONE, "TC-38, TC-41"),
  ("PB-19", "Buổi 9", "Là nhóm, tôi muốn có ảnh minh chứng cho từng test case để đưa vào báo cáo và chấm Rubric 3", "20 kịch bản Playwright chạy lại được, ảnh đặt tên theo mã TC; ảnh kết quả Jest/k6/Docker dựng từ file kết quả thật", "Cao", 5, "Sprint 4", DONE, "TC-01..TC-48"),
  ("PB-20", "Buổi 9-10", "Là nhóm, tôi muốn có báo cáo 8 mục, slide và dữ liệu demo để bảo vệ đề tài", "Báo cáo Word có mục lục, hình, bảng; 14 slide có ghi chú; seed dữ liệu demo", "Cao", 5, "Sprint 4", DONE, ""),
  ("PB-21", "FR-01, FR-07", "Là bệnh viện, tôi muốn người nhà không phải tạo tài khoản: nhân viên đăng ký trước, người nhà nhập 3 thông tin để xem", "API /auth/family-access và /surgeries/{id}/family-contacts; bỏ mã/QR và tự đăng ký; cập nhật web, test, tài liệu", "Cao", 5, "Sprint 4", DONE, "TC-03..05, TC-11, TC-22, TC-39, TC-40, TC-49..51"),
]
SPRINTS = [
  ("Sprint 0", "Buổi 1-5", "Khởi tạo dự án, thiết kế CSDL/API, môi trường phát triển", "PB-16 (một phần)", "Hoàn thành (15/10/2026)"),
  ("Sprint 1", "Buổi 6", "Luồng cốt lõi: xác thực, ca mổ, trạng thái, liên kết người nhà (ban đầu bằng mã/QR)", "PB-01..PB-08, PB-10, PB-13", "Hoàn thành (15/10/2026)"),
  ("Sprint 2", "Buổi 7 (giữa kỳ 2)", "Thông báo đẩy, cập nhật thời gian thực, trang quản trị, nhật ký truy cập", "PB-08, PB-09, PB-11, PB-12", "Gần xong (còn thử push FCM thật)"),
  ("Sprint 3", "Buổi 8-9", "Kiểm thử, sửa lỗi, thử tải, triển khai Docker, sao lưu", "PB-15..PB-18", "Hoàn thành (15/10/2026)"),
  ("Sprint 4", "Buổi 9-10", "Minh chứng tự động, báo cáo 8 mục, slide, dữ liệu demo; đổi cách người nhà vào xem", "PB-19..PB-21", "Hoàn thành (17/10/2026)"),
  ("Báo cáo", "Buổi 10 + bảo vệ", "Tổng duyệt, quay video dự phòng; thử push FCM thật nếu có Firebase", "PB-09 (phần còn lại)", "Chưa làm"),
]
SESSIONS = [
  (1, "Giới thiệu, phân nhóm, chọn đề tài", "Danh sách nhóm + đề tài, mục tiêu và 3-4 tính năng"),
  (2, "Phân tích yêu cầu", "SRS rút gọn, FR đã đánh số"),
  (3, "Kế hoạch Agile/Scrum", "Product backlog, kế hoạch sprint"),
  (4, "Kiến trúc tổng thể", "Sơ đồ kiến trúc, lựa chọn công nghệ"),
  (5, "Thiết kế chi tiết (giữa kỳ 1)", "ERD, API contract, wireframe, môi trường dev sẵn sàng"),
  (6, "Sprint 1", "Luồng cốt lõi chạy được"),
  (7, "Sprint 2 (giữa kỳ 2)", "Sản phẩm demo được"),
  (8, "Kiểm thử và tinh chỉnh", "Bảng kết quả test, danh sách hạn chế"),
  (9, "Triển khai, viết báo cáo", "Bản triển khai, báo cáo nháp"),
  (10, "Tổng duyệt", "Sản phẩm, báo cáo và slide hoàn chỉnh"),
]
WORKLOG = [
  ("15/10/2026", "ThienBao19", "Khởi tạo monorepo NestJS + Next.js, Prisma schema 11 bảng, Docker PostgreSQL, seed", "Build, lint, test pass", "2cdbe26"),
  ("15/10/2026", "ThienBao19", "Sprint 1: xác thực, phân quyền, bệnh nhân, ca mổ, trạng thái, mã/QR, liên kết, giao diện", "25 unit + 30 e2e test pass; chạy thử luồng QR trên trình duyệt", "b50b136"),
  ("15/10/2026", "ThienBao19", "Lập file Excel kết quả kiểm thử, backlog, nhật ký", "docs/kiem-thu, docs/quan-ly", ""),
  ("15/10/2026", "ThienBao19", "Sprint 2: thông báo (lưu, push FCM, thử lại), SSE realtime, trang quản trị, nhật ký truy cập, trang Thông báo/Cài đặt", "37 unit + 48 e2e test pass; độ trễ cập nhật màn hình người nhà 113 ms", "0372531"),
  ("15/10/2026", "ThienBao19", "Sprint 3: rà lỗi (12 lỗi đã sửa + 5 hạn chế, ghi Bug log), thử tải k6 100/500 người nhà, Docker + nginx + sao lưu, tự đăng xuất", "53 unit + 56 e2e pass, coverage 94%; 500 người nhà: 0 lỗi, thông báo p95 1,04 s", "1162c31"),
  ("16/10/2026", "ThienBao19", "Sprint 4: dữ liệu demo, 20 kịch bản Playwright + 36 ảnh minh chứng, sửa BUG-13..16, báo cáo Word 39 trang, 14 slide", "47/48 test case đạt; 110 test Jest pass", ""),
  ("17/10/2026", "ThienBao19", "Đổi cách người nhà vào xem: nhân viên đăng ký SĐT + họ tên người nhà, người nhà nhập SĐT + họ tên + tên bệnh nhân (không mật khẩu); bỏ mã/QR và tự đăng ký; seed 1 quản trị + 3 nhân viên; viết lại test, cập nhật tài liệu", "54 unit + 56 e2e + 19 kịch bản Playwright đạt; 50/51 test case đạt", ""),
]
