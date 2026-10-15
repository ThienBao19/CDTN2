# Thử tải (k6)

Kịch bản `tc10-nhieu-nguoi-nha.js` ứng với **TC-10, NFR-01, NFR-02, NFR-03**:
- Bước chuẩn bị: tạo một ca, N tài khoản người nhà, cấp mã và liên kết từng người.
- N người nhà cùng mở màn hình theo dõi, mỗi giây tải trạng thái và danh sách thông báo.
- Nhân viên đổi lần lượt 4 trạng thái, mỗi lần cách nhau 8 giây.

Ngưỡng đạt: thông báo hiện tới người nhà p95 < 5 s, tải màn hình trạng thái p95 < 2 s, lỗi < 1%.
`notify_visible_ms` là giới hạn trên (người nhà poll mỗi 1 giây; ứng dụng thật nhận qua SSE nhanh hơn).

## Chạy với stack Docker (khuyến nghị)

Bước chuẩn bị tạo nhiều tài khoản rất nhanh, nên tạm nới giới hạn đăng nhập/đăng ký trong lúc thử:

```bash
LOGIN_RATE_LIMIT=100000 RATE_LIMIT=100000 docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d api
```

```bash
docker run --rm --network patient-tracker_default -v "$PWD/loadtest:/scripts" -e BASE_URL=http://nginx -e STAFF_PASSWORD=<SEED_PASSWORD> -e FAMILIES=100 grafana/k6:1.3.0 run --summary-export /scripts/ket-qua-tc10.json /scripts/tc10-nhieu-nguoi-nha.js
```

Thử xong nhớ trả giới hạn về mặc định:

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d api
```

## Kết quả ngày 15/10/2026 (Docker Desktop, laptop Windows 11)

| Chỉ tiêu | 100 người nhà | 500 người nhà | Ngưỡng |
|---|---|---|---|
| Thông báo hiện tới người nhà, p95 | 697 ms | 1,04 s | < 5 s (NFR-01) |
| Tải màn hình trạng thái, p95 | 34 ms | 79 ms | < 2 s (NFR-02) |
| Đổi trạng thái (kèm tạo N thông báo), p95 | 53 ms | 158 ms | — |
| Request lỗi | 0 / 6 407 | 0 / 30 841 | < 1% |
| Người nhận đủ 4 thông báo | 100 / 100 | 500 / 500 | 100% |

Chạy qua proxy `/api` của Next.js (chế độ dev, không có nginx) thì có 3% request lỗi kết nối với 100 người dùng
(BUG-10), nên khi triển khai luôn đặt nginx phía trước như `deploy/nginx.conf`.
