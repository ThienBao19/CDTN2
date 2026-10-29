const { h2, p, bullets, tbl, img } = require('./lib');

module.exports = () => [
  h2('6.4. Kiểm thử hiệu năng'),
  p('Kịch bản k6 tạo một ca, N người nhà (mỗi người được nhân viên đăng ký rồi vào xem bằng SĐT + họ tên + tên bệnh nhân), cho N người cùng mở màn hình theo dõi và tải lại mỗi giây, trong khi nhân viên đổi lần lượt 4 trạng thái. Chỉ số “thông báo tới người nhà” là giới hạn trên vì người nhà trong kịch bản poll mỗi giây; ứng dụng thật nhận qua SSE nên nhanh hơn (đo trên trình duyệt: 113 ms).'),
  ...tbl('Kết quả thử tải qua nginx (Docker Desktop, laptop Windows 11)', ['Chỉ số', '100 người nhà', '500 người nhà', 'Ngưỡng'], [
    ['Thông báo tới người nhà, p95', '697 ms', '1,04 s', '< 5 s (NFR-01)'],
    ['Tải màn hình trạng thái, p95', '34 ms', '79 ms', '< 2 s (NFR-02)'],
    ['Đổi trạng thái kèm tạo N thông báo, p95', '53 ms', '158 ms', '—'],
    ['Request lỗi', '0 / 6 407', '0 / 30 841', '< 1%'],
    ['Người nhận đủ 4 thông báo', '100 / 100', '500 / 500', '100%'],
  ], [3.8, 2, 2, 2.4]),
  ...img('kiem-thu/anh/KQ-05-k6-500-nguoi-nha.png', 'Kết quả k6 với 500 người nhà', 14),
  p('Lần chạy đầu tiên qua proxy /api của Next.js (chưa có nginx) cho 3% request lỗi kết nối và có người nhà nhận thông báo trễ tới 32 giây. Chạy thẳng vào API thì không còn lỗi, chứng tỏ nút thắt nằm ở proxy chứ không ở API. Nhóm bổ sung nginx làm cổng vào khi triển khai (BUG-10), sau đó cả 100 và 500 người đều đạt mọi ngưỡng.'),
];
