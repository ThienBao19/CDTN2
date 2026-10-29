# Thay đổi 17/10/2026: người nhà không có tài khoản/mật khẩu; nhân viên đăng ký SĐT + họ tên người nhà vào ca;
# người nhà vào xem bằng SĐT + họ tên mình + họ tên bệnh nhân. Bỏ mã theo dõi/QR và tự đăng ký.
OK = "Đạt"
FA = "test/family-access.e2e-spec.ts"
UI1 = "e2e/tests/01-luong-chinh.spec.ts"
UI2 = "e2e/tests/02-loi-va-phien.spec.ts"
AUTH = "test/auth.e2e-spec.ts"
UI7 = "e2e/tests/07-am-bao-va-phien.spec.ts"

REPLACE = {
  "TC-03": ("TC-03", "FR-07", "Người nhà vào xem bằng SĐT + họ tên + tên bệnh nhân", "Nhân viên đăng ký người nhà (SĐT + họ tên) → người nhà nhập SĐT, họ tên mình, họ tên bệnh nhân", "Vào xem được ngay, không mật khẩu; thấy bệnh nhân với tên ẩn bớt", "API e2e + UI", FA + " › TC-03; " + UI1 + " › TC-03", "200; danh sách có ca, tên 'N. V. An'; giao diện vào thẳng /theo-doi", OK),
  "TC-04": ("TC-04", "FR-07, BR-03", "Thông tin không khớp với đăng ký", "Sai họ tên bệnh nhân / sai họ tên người nhà / SĐT chưa được đăng ký", "Báo 'chưa khớp với đăng ký của bệnh viện', không vào được", "API e2e + UI", FA + " › TC-04; " + UI2 + " › TC-04", "401 cho cả 3 trường hợp; giao diện hiện thông báo lỗi", OK),
  "TC-05": ("TC-05", "FR-07, Mục 7", "Nhập sai nhiều lần liên tiếp", "Nhập sai 5 lần với cùng một SĐT → lần 6", "Tạm khóa theo SĐT 15 phút", "API e2e + Unit + UI", FA + " › TC-05; attempt-limiter.spec.ts; " + UI2 + " › TC-05", "401 ×5 rồi 429 'nhập sai quá nhiều lần'", OK),
  "TC-06": ("TC-06", "BR-03, NFR-07", "Người nhà xem ca không được đăng ký cho mình", "GET /my/surgeries/{id}, /surgeries/{id}/history, /surgeries/{id} của ca khác", "Bị từ chối (403/404), không lộ dữ liệu", "API e2e", FA + " › TC-06", "404, 404, 403", OK),
  "TC-08": ("TC-08", "FR-13", "Gỡ quyền theo dõi", "Nhân viên bấm 'Gỡ quyền' (hoặc người nhà 'Ngừng theo dõi') → người nhà mở lại ứng dụng", "Không xem được nữa; nhập lại thông tin bị từ chối", "API e2e + UI", FA + " › TC-08; " + UI1 + " › TC-08", "401 'Phiên theo dõi đã kết thúc'; giao diện về /nguoi-nha, nhập lại báo 'chưa khớp'", OK),
  "TC-11": ("TC-11", "FR-01, FR-07", "Nhân viên đăng ký người nhà cho ca", "Chi tiết ca → nhập SĐT + họ tên người nhà → Đăng ký", "Người nhà có trong danh sách của ca; SĐT của tài khoản nhân viên bị từ chối", "API e2e + UI", FA + " › staff registers…; " + UI1 + " › UC-01", "201, danh sách có người nhà; SĐT nhân viên trả 409", OK),
  "TC-19": ("TC-19", "Mục 7", "Người nhà vẫn xem trong 24 giờ sau khi ca hoàn tất", "Đi đủ 5 trạng thái → người nhà xem chi tiết ca", "Vẫn xem được kết quả", "API e2e", FA + " › BUG-03", "200 ngay sau khi hoàn tất", OK),
  "TC-20": ("TC-20", "NFR-07, Mục 7", "Người nhà chỉ thấy dữ liệu cần thiết", "Nhân viên ghi chú nội bộ → người nhà xem chi tiết", "Không thấy ghi chú, họ tên được ẩn bớt", "API e2e + Unit", FA + " › FR-08; mask-name.spec.ts", "Không có ghi chú; tên 'N. V. An'", OK),
  "TC-22": ("TC-22", "FR-07, NFR-08", "Gõ không dấu, hoa thường, SĐT có khoảng trắng hoặc +84", "Nhập 'tran thi MAI', 'nguyen van an', '+84 901 234 567'", "Vẫn vào xem được", "API e2e + UI", FA + " › accepts names…; " + UI2 + " › gõ không dấu", "200; giao diện vào /theo-doi", OK),
  "TC-23": ("TC-23", "BR-05", "Không gửi thông báo cho người không còn quyền", "Nhân viên gỡ quyền một người nhà; người nhà của ca khác → đổi trạng thái", "Không ai trong hai người nhận thông báo của ca", "API e2e", "test/notifications.e2e-spec.ts › BR-05", "Không có thông báo nào được tạo cho ca", OK),
  "TC-26": ("TC-26", "FR-08, mục 11.2", "Cập nhật thời gian thực qua SSE", "Mở luồng sự kiện của người nhà được đăng ký và của người nhà ca khác → đổi trạng thái", "Chỉ người được đăng ký nhận sự kiện; màn hình đổi ngay", "API e2e + UI", "test/events.e2e-spec.ts; " + UI1 + " › TC-26", "Người ca khác không nhận; màn hình người nhà đổi trong vài trăm ms", OK),
  "TC-30": ("TC-30", "FR-11", "Xem nhật ký truy cập", "Lọc theo hành động, phân trang; người nhà mở chi tiết ca nhiều lần", "Kết quả đúng bộ lọc; lượt xem ghi 1 lần mỗi 5 phút", "API e2e + UI", "test/admin.e2e-spec.ts; " + FA + " › FR-11", "Đúng như mong đợi", OK),
  "TC-35": ("TC-35", "BUG-11", "Né giới hạn tần suất bằng token giả", "Gọi API công khai cùng IP, mỗi lần kèm Bearer ngẫu nhiên", "Token giả bị tính theo IP, không né được giới hạn", "Unit", "app-throttler.guard.spec.ts › BUG-11", "Đạt (lần kiểm thủ công 15/10 làm trên /auth/register, API này đã bỏ ngày 17/10)", OK),
  "TC-36": ("TC-36", "BUG-02", "Không đăng ký thêm người nhà khi ca đã kết thúc", "Hoàn tất ca → nhân viên đăng ký người nhà", "Bị từ chối", "API e2e", FA + " › UC-01 exception", "409", OK),
  "TC-37": ("TC-37", "BUG-03", "Quyền xem hết hiệu lực sau khi ca kết thúc", "Hoàn tất ca → chạy thu hồi ngay và sau 25 giờ", "Ngay sau vẫn xem được; sau 24 giờ phiên người nhà kết thúc", "API e2e", FA + " › BUG-03", "200 rồi 401, liên kết REVOKED", OK),
  "TC-39": ("TC-39", "FR-02", "Người nhà không có mật khẩu và không gọi được API nhân viên", "Người nhà gọi POST /patients và PUT /auth/password", "Bị từ chối do sai vai trò", "API e2e", AUTH + " › forbids a family member…", "403, 403", OK),
  "TC-40": ("TC-40", "FR-01", "Người nhà dùng trang đăng nhập nhân viên", "Nhập SĐT người nhà + mật khẩu bất kỳ ở /dang-nhap", "Bị từ chối; trang có lối sang /nguoi-nha", "API e2e + UI", AUTH + " › does not let a family member use password login; " + UI2 + " › TC-40", "401; trang hiện link 'Vào xem bằng số điện thoại'", OK),
  "TC-47": ("TC-47", "BUG-15", "Giờ cập nhật của người nhà là giờ đổi trạng thái", "Đổi trạng thái → sửa tên ca → người nhà xem chi tiết", "Giờ hiển thị không đổi khi chỉ sửa tên ca", "API e2e", FA + " › BUG-15", "Đúng như mong đợi", OK),
}

EXTRA2 = [
  ("TC-49", "FR-01", "Có sẵn 3 tài khoản nhân viên và 1 quản trị viên", "Seed → đăng nhập nhanvien1/2/3@benhvien.test, admin@benhvien.test", "Cả 4 tài khoản đăng nhập được, đúng vai trò", "API e2e", AUTH + " › seeds 3 staff accounts…", "200, role STAFF cho cả 3 nhân viên", OK),
  ("TC-50", "FR-01", "Bỏ tự đăng ký tài khoản", "POST /auth/register", "Không còn API tự đăng ký", "API e2e", AUTH + " › no longer offers public self-registration", "404", OK),
  ("TC-51", "FR-07", "Một SĐT được đăng ký cho 2 ca", "Nhân viên đăng ký cùng SĐT vào 2 ca → người nhà vào xem 1 lần", "Thấy cả 2 ca", "API e2e", FA + " › one phone registered for two surgeries…", "Danh sách có đủ 2 ca", OK),
  ("TC-52", "FR-02", "Mở lại app khi phiên người nhà còn hạn", "Người nhà vào xem → đóng app → mở lại từ màn hình chính (trang chủ, /nguoi-nha)", "Vào thẳng màn hình theo dõi, không phải nhập lại thông tin", "UI (Playwright)", UI7 + " › TC-52", "Chuyển thẳng tới /theo-doi; cookie phiên SameSite=Lax 7 ngày (sửa BUG-17)", OK),
  ("TC-53", "FR-09", "Âm báo khi xong một giai đoạn", "App người nhà đang mở → nhân viên chuyển 'Đã tiếp nhận' → 'Đang chuẩn bị'", "Kêu một âm báo ngắn và rung nhẹ, không hiện chuông", "UI (Playwright) + Unit", UI7 + " › TC-53; notifications.service.spec.ts", "2 nốt âm báo + 1 lần rung; thông báo đẩy mang alert=stage", OK),
  ("TC-54", "FR-09", "Chuông reo khi ca kết thúc", "App người nhà đang mở → nhân viên chuyển ca tới 'Đã hoàn tất' → bấm 'Tắt chuông'", "Chuông reo và rung lặp lại tới khi người nhà bấm tắt", "UI (Playwright) + Unit", UI7 + " › TC-54", "Hiện bảng 'Ca phẫu thuật đã hoàn tất', chuông lặp mỗi 1,6 giây, dừng hẳn sau khi bấm tắt; push alert=final giữ thông báo trên màn hình (requireInteraction)", OK),
]

SHARED_V2 = {
    "TC-31": "anh/TC-31a-chuan-bi.png, anh/TC-31b-bat-dau.png, anh/TC-31c-hoi-suc.png, anh/TC-31d-hoan-tat.png",
    "TC-52": "anh/TC-52-mo-lai-app.png",
    "TC-53": "anh/TC-53-am-bao-giai-doan.png",
    "TC-54": "anh/TC-54-chuong-ket-thuc.png",
  "TC-11": "anh/UC-01-dang-ky-nguoi-nha.png",
  "TC-22": "anh/TC-03b-khong-dau.png",
}
