# (mã, FR, kịch bản, bước + dữ liệu, kết quả mong đợi, loại, test tự động, kết quả thực tế, trạng thái)
E2E_S = "test/surgery-status.e2e-spec.ts"
E2E_L = "test/linking.e2e-spec.ts"
E2E_A = "test/auth.e2e-spec.ts"
OK = "Đạt"
TODO = "Chưa test"
ROWS = [
  ("TC-01", "FR-05, FR-10", "Nhân viên chuyển trạng thái đúng thứ tự", "Ca ở 'Đã tiếp nhận' → chọn 'Đang chuẩn bị' → Xác nhận", "Lưu thành công, có bản ghi lịch sử, (Sprint 2) người nhà nhận thông báo", "API e2e + Unit + UI", E2E_S + " › TC-01; status-transition.spec.ts", "201, lịch sử 2 bản ghi; người nhà nhận thông báo trong ứng dụng (notifications.e2e TC-01). Push FCM xem TC-31", OK),
  ("TC-02", "FR-05, BR-01", "Nhân viên bỏ qua một bước trạng thái", "Ca ở 'Đã tiếp nhận' → gửi 'Đang phẫu thuật'", "Bị từ chối với thông báo lỗi rõ ràng", "API e2e + Unit", E2E_S + " › TC-02", "400 'Chỉ được chuyển sang trạng thái kế tiếp'", OK),
  ("TC-03", "FR-07", "Người nhà nhập mã hợp lệ", "Nhân viên cấp mã → người nhà nhập mã (chữ thường cũng được)", "Liên kết thành công, thấy bệnh nhân trong danh sách", "API e2e + UI", E2E_L + " › TC-03", "201; danh sách có ca, tên hiển thị 'N. V. An'", OK),
  ("TC-04", "FR-06, BR-02", "Người nhà nhập mã hết hạn, đã thu hồi hoặc đã dùng", "Dùng lại mã đã dùng / mã bị thu hồi / mã quá hạn", "Báo lỗi, không tạo liên kết", "API e2e", E2E_L + " › TC-04 (3 test)", "400 với thông báo tương ứng cho cả 3 trường hợp", OK),
  ("TC-05", "FR-07, Mục 7", "Nhập sai mã nhiều lần liên tiếp", "Nhập sai mã 5 lần → lần 6", "Tạm khóa nhập mã trong một khoảng thời gian", "API e2e + Unit", E2E_L + " › TC-05; attempt-limiter.spec.ts", "5 lần đầu 400, lần 6 trả 429 (khóa 15 phút)", OK),
  ("TC-06", "BR-03, NFR-07", "Người nhà gọi API xem ca chưa liên kết", "GET /my/surgeries/{id}, /surgeries/{id}/history, /surgeries/{id}", "Bị từ chối (403/404), không lộ dữ liệu", "API e2e", E2E_L + " › TC-06", "404, 404, 403", OK),
  ("TC-07", "FR-02", "Người nhà gọi API cập nhật trạng thái", "Đăng nhập người nhà / quản trị → POST /surgeries/{id}/status", "Bị từ chối do sai vai trò", "API e2e + Unit", E2E_S + " › TC-07; roles.guard.spec.ts", "403 cho cả người nhà và quản trị viên", OK),
  ("TC-08", "FR-13", "Thu hồi liên kết", "Người nhà bấm 'Ngừng theo dõi' → mở lại chi tiết ca", "Ngừng nhận thông báo và không xem được ca", "API e2e", E2E_L + " › TC-08", "204, xem ca trả 404 và không nhận thông báo mới (notifications.e2e BR-05)", OK),
  ("TC-09", "FR-09", "Thiết bị offline khi trạng thái đổi", "Tắt mạng điện thoại → đổi trạng thái → bật mạng", "Nhận thông báo/trạng thái mới khi có mạng lại", "API e2e", "test/notifications.e2e-spec.ts › TC-09", "Thông báo được lưu, mở lại app thấy đủ và đánh dấu đã đọc; SSE tự kết nối lại. Push khi offline xem TC-31", OK),
  ("TC-10", "NFR-01, NFR-03", "100 người nhà theo dõi cùng một ca", "k6: 100 người dùng polling, đổi trạng thái", "Tất cả nhận thông báo trong ngưỡng NFR-01 (< 5 giây)", "Hiệu năng (k6)", "loadtest/tc10-nhieu-nguoi-nha.js", "Qua nginx: 0/6407 lỗi, thông báo p95 697 ms, màn hình p95 34 ms, 100/100 nhận đủ (xem BUG-10)", OK),
  ("TC-11", "FR-01", "Đăng ký tài khoản người nhà", "Nhập họ tên, SĐT, mật khẩu ≥ 8 ký tự", "Tạo tài khoản vai trò người nhà, không trả mật khẩu", "API e2e + UI", E2E_A, "201, role FAMILY; trùng SĐT trả 409", OK),
  ("TC-12", "FR-01", "Đăng nhập sai mật khẩu", "Nhập đúng email, sai mật khẩu", "Báo lỗi, không đăng nhập được", "API e2e", E2E_A, "401", OK),
  ("TC-13", "FR-01", "Đổi mật khẩu", "Đổi mật khẩu → đăng nhập bằng mật khẩu cũ và mới", "Mật khẩu cũ bị từ chối, mật khẩu mới đăng nhập được", "API e2e", E2E_A, "Đúng như mong đợi", OK),
  ("TC-14", "FR-02", "Gọi API khi chưa đăng nhập", "GET /my/surgeries không có token", "Bị từ chối 401", "API e2e", E2E_A, "401", OK),
  ("TC-15", "FR-03", "Tạo bệnh nhân trùng mã", "Tạo 2 bệnh nhân cùng mã", "Lần 2 bị từ chối", "API e2e", E2E_S, "409 'Mã bệnh nhân đã tồn tại'", OK),
  ("TC-16", "FR-04", "Tạo ca phẫu thuật", "Chọn/tạo bệnh nhân, nhập tên ca, giờ, phòng", "Ca ở trạng thái 'Đã tiếp nhận', có 1 bản ghi lịch sử", "API e2e + UI", E2E_S, "Đúng như mong đợi", OK),
  ("TC-17", "BR-01", "Quay lui/bỏ bước có quyền và lý do", "Điều chỉnh không lý do → có lý do", "Không lý do bị từ chối; có lý do được lưu và đánh dấu điều chỉnh", "API e2e + Unit", E2E_S, "400 rồi 201, lịch sử isOverride = true", OK),
  ("TC-18", "FR-04", "Đổi trạng thái ca đã hủy", "Hủy ca có lý do → đổi trạng thái", "Bị từ chối", "API e2e", E2E_S, "409 'Ca đã bị hủy'", OK),
  ("TC-19", "UC-01", "Cấp mã cho ca đã hoàn tất", "Đi đủ 5 trạng thái → cấp mã", "Không cho tạo mã mới", "API e2e", E2E_L, "409", OK),
  ("TC-20", "NFR-07, Mục 7", "Người nhà chỉ thấy dữ liệu cần thiết", "Nhân viên ghi chú nội bộ → người nhà xem chi tiết", "Không thấy ghi chú, họ tên được ẩn bớt", "API e2e + Unit", E2E_L + " › FR-08; mask-name.spec.ts", "Không có ghi chú; tên 'N. V. An'", OK),
  ("TC-21", "FR-08", "Màn hình người nhà tự cập nhật", "Mở chi tiết ca → nhân viên đổi trạng thái", "Trạng thái mới hiện trong ≤ 10 giây, không cần tải lại", "UI thủ công", "", "Đổi sang 'Đang phẫu thuật' sau < 10 giây", OK),
  ("TC-22", "FR-06, FR-07", "Mở đường dẫn trong QR khi chưa đăng nhập", "Mở /lien-ket?code=... → đăng ký → quay lại", "Sau đăng ký quay về trang liên kết, mã được điền sẵn", "UI thủ công", "", "Đúng như mong đợi", OK),
  ("TC-23", "BR-05", "Không gửi thông báo cho người không còn liên kết", "Người nhà hủy liên kết; người lạ chưa liên kết → đổi trạng thái", "Cả hai không nhận thông báo", "API e2e", "test/notifications.e2e-spec.ts › BR-05", "Danh sách thông báo của cả hai rỗng", OK),
  ("TC-24", "FR-09", "Thông báo khi đổi lịch hoặc phòng", "Sửa tên ca → sửa giờ dự kiến", "Chỉ đổi lịch mới gửi 'Lịch phẫu thuật có thay đổi...'", "API e2e + UI", "test/notifications.e2e-spec.ts", "Đúng 1 thông báo; UI hiện sau 113 ms", OK),
  ("TC-25", "FR-09, mục 11.1", "Gửi push lỗi thì thử lại có giới hạn", "Giả lập FCM lỗi tạm thời / token hỏng", "Thử lại tối đa 3 lần, ghi FAILED + lỗi; xóa token hỏng", "Unit", "notifications.service.spec.ts; retry.spec.ts", "Đúng như mong đợi", OK),
  ("TC-26", "FR-08, mục 11.2", "Cập nhật thời gian thực qua SSE", "Mở luồng sự kiện của người nhà đã liên kết và người lạ → đổi trạng thái", "Chỉ người đã liên kết nhận sự kiện; màn hình đổi ngay", "API e2e + UI", "test/events.e2e-spec.ts", "Người lạ không nhận; qua proxy web nhận ngay, UI cập nhật 113 ms", OK),
  ("TC-27", "FR-12", "Quản trị viên tạo tài khoản nhân viên", "Tạo tài khoản STAFF → đăng nhập", "Tài khoản mới đăng nhập được; không tạo được vai trò người nhà", "API e2e + UI", "test/admin.e2e-spec.ts", "201, đăng nhập được; role FAMILY bị 400", OK),
  ("TC-28", "FR-12", "Khóa tài khoản", "Khóa tài khoản đang đăng nhập; quản trị tự khóa mình", "Phiên cũ bị từ chối, đăng nhập lại bị từ chối; không tự khóa được", "API e2e + UI", "test/admin.e2e-spec.ts", "401, 403; tự khóa trả 400", OK),
  ("TC-29", "FR-12", "Sửa nội dung thông báo trong danh mục trạng thái", "Đổi nội dung 'Đang chuẩn bị' → đổi trạng thái một ca", "Người nhà nhận nội dung mới", "API e2e", "test/admin.e2e-spec.ts", "Đúng nội dung mới", OK),
  ("TC-30", "FR-11", "Xem nhật ký truy cập", "Lọc theo hành động, phân trang; người nhà mở chi tiết ca nhiều lần", "Kết quả đúng bộ lọc; lượt xem ghi 1 lần mỗi 5 phút", "API e2e + UI", "test/admin.e2e-spec.ts; linking.e2e-spec.ts › FR-11", "Đúng như mong đợi", OK),
  ("TC-31", "FR-09", "Push FCM thật tới điện thoại (cả khi app đóng/offline)", "Cấu hình Firebase → bật thông báo trong Cài đặt → đổi trạng thái", "Điện thoại hiện thông báo trong < 5 giây", "Thủ công", "", "iPhone (PWA thêm vào màn hình chính) đang tắt màn hình vẫn hiện thông báo 'Bệnh nhân đang được chuyển sang khu vực hồi sức' ngay sau khi đổi trạng thái; FCM trả SENT (dự án Firebase cdtn2-f0527)", OK),
  ("TC-32", "FR-02", "Nhân viên gọi API quản trị", "Đăng nhập nhân viên → GET /admin/*", "Bị từ chối 403", "API e2e", "test/admin.e2e-spec.ts", "403 cho cả 4 API", OK),
]
