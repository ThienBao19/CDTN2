OK, TODO = "Đạt", "Chưa test"
K6 = "loadtest/tc10-nhieu-nguoi-nha.js"
EXTRA = [
    ("TC-33", "NFR-03", "500 người nhà cùng theo dõi một ca", "k6 với FAMILIES=500 qua nginx, đổi 4 trạng thái", "Không lỗi; thông báo p95 < 5 s; màn hình p95 < 2 s", "Hiệu năng (k6)", K6, "0/30841 lỗi (300 req/s); thông báo p95 1,04 s; màn hình p95 79 ms; 500/500 nhận đủ", OK),
    ("TC-34", "BUG-01", "Dò mật khẩu bằng cách đổi X-Forwarded-For", "12 lần đăng nhập sai cùng tài khoản, mỗi lần một IP giả khác", "Bị chặn (429) từ lần thứ 11", "Unit + thủ công", "app-throttler.guard.spec.ts › BUG-01", "401 ×10 rồi 429", OK),
    ("TC-35", "BUG-11", "Né giới hạn đăng ký bằng token giả", "12 lần đăng ký cùng IP, mỗi lần kèm Bearer ngẫu nhiên", "Bị chặn (429) từ lần thứ 11", "Unit + thủ công (Docker)", "app-throttler.guard.spec.ts › BUG-11", "201 ×10 rồi 429", OK),
    ("TC-36", "BUG-02", "Liên kết với ca đã hoàn tất", "Cấp mã → hoàn tất ca → nhập mã", "Bị từ chối, báo ca đã kết thúc", "API e2e", "test/linking.e2e-spec.ts › BUG-02", "400 'Ca phẫu thuật đã kết thúc'", OK),
    ("TC-37", "BUG-03", "Liên kết hết hiệu lực sau khi ca kết thúc", "Hoàn tất ca → chạy thu hồi ngay và sau 25 giờ", "Ngay sau vẫn xem được; sau 24 giờ liên kết bị thu hồi", "API e2e", "test/linking.e2e-spec.ts › BUG-03", "200 rồi 404, liên kết REVOKED", OK),
    ("TC-38", "BUG-04", "Thu hồi phiên khi đổi mật khẩu/vai trò", "2 phiên → đổi mật khẩu; quản trị đổi vai trò tài khoản đang đăng nhập", "Phiên cũ bị từ chối; phiên vừa đổi nhận token mới", "API e2e", "auth.e2e-spec.ts, admin.e2e-spec.ts › BUG-04", "401 cho phiên cũ; token mới dùng được", OK),
    ("TC-39", "BUG-06", "Hết phiên khi mở link QR", "Thu hồi phiên → mở /lien-ket?code=... → bấm Theo dõi → đăng nhập lại", "Về trang đăng nhập, rồi quay lại đúng trang với mã điền sẵn", "UI thủ công (Docker)", "", "Đúng như mong đợi, liên kết thành công", OK),
    ("TC-40", "BUG-07", "Đăng nhập với link chuyển hướng sai vai trò", "Mở /dang-nhap?next=/staff, đăng nhập bằng người nhà", "Về /theo-doi thay vì trang lỗi", "UI thủ công (Docker)", "", "Về /theo-doi", OK),
    ("TC-41", "Mục 7", "Tự đăng xuất nhân viên khi không thao tác", "Đăng nhập nhân viên, để yên 30 phút", "Tự đăng xuất, trang đăng nhập báo phiên kết thúc", "UI (Playwright)", "e2e/tests/02-loi-va-phien.spec.ts › TC-41", "Tua đồng hồ 31 phút: tự về trang đăng nhập kèm thông báo; /auth/me trả 401", OK),
    ("TC-42", "NFR-11", "Sao lưu và khôi phục CSDL", "Khởi động stack Docker → lấy bản sao lưu → khôi phục vào CSDL tạm", "Bản sao lưu đủ dữ liệu, khôi phục được", "Thủ công (Docker)", "deploy/backup.sh", "12 bảng, 926 tài khoản, 4 ca (sau khi sửa BUG-12)", OK),
    ("TC-43", "NFR-09", "Triển khai toàn hệ thống bằng Docker", "docker compose up --build → seed → mở http://localhost:8080", "5 container chạy; đăng nhập và các luồng chính hoạt động", "Thủ công (Docker)", "deploy/docker-compose.yml", "postgres, api, web, nginx, backup đều chạy; API healthy", OK),
    ("TC-44", "BUG-08", "Ghi nhật ký đăng nhập sai", "Đăng nhập sai mật khẩu → đếm LOGIN_FAILED", "Tăng thêm 1 bản ghi", "API e2e", "test/auth.e2e-spec.ts › BUG-08", "Đúng như mong đợi", OK),
    ("TC-45", "BUG-09", "Header Authorization ưu tiên hơn cookie", "Gửi cả cookie người nhà và Bearer nhân viên", "Xử lý theo Bearer", "Unit", "extract-token.spec.ts › BUG-09", "Đúng như mong đợi", OK),
]

EXTRA = EXTRA + [
    ("TC-46", "BUG-13, FR-04", "Nhân viên sửa giờ mổ trên giao diện", "Chi tiết ca → Sửa thông tin ca → đổi giờ → Lưu", "Lưu thành công; người nhà nhận thông báo đổi lịch", "UI (Playwright)", "e2e/tests/01-luong-chinh.spec.ts › TC-24", "Đúng như mong đợi", OK),
    ("TC-47", "BUG-15", "Giờ cập nhật của người nhà là giờ đổi trạng thái", "Đổi trạng thái → sửa tên ca → người nhà xem chi tiết", "Giờ hiển thị không đổi khi chỉ sửa tên ca", "API e2e", "test/linking.e2e-spec.ts › BUG-15", "Đúng như mong đợi", OK),
]

EXTRA = EXTRA + [
    ("TC-48", "BUG-16, NFR-11", "Sao lưu lỗi phải báo thất bại", "Chạy backup.sh --once với CSDL không tồn tại", "Báo 'Sao lưu thất bại', không tạo file rỗng", "Thủ công (Docker)", "deploy/backup.sh", "Đúng như mong đợi (số file trước/sau không đổi)", OK),
]
