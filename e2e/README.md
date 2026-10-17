# Kiểm thử giao diện và ảnh minh chứng (Playwright)

23 kịch bản chạy trên trình duyệt thật với stack Docker, đồng thời chụp ảnh minh chứng vào
`docs/kiem-thu/anh/` (tên ảnh = mã test case, dùng trong file Excel kết quả kiểm thử và báo cáo).

| File | Nội dung |
|---|---|
| `01-luong-chinh.spec.ts` | Luồng trình diễn: tạo ca → cấp mã QR → người nhà đăng ký, liên kết → đổi trạng thái → realtime → đổi lịch → hủy liên kết |
| `02-loi-va-phien.spec.ts` | Sai mật khẩu, mã thu hồi, khóa sau 5 lần sai, chuyển hướng theo vai trò, hết phiên khi mở QR, tự đăng xuất sau 30 phút |
| `03-quan-tri.spec.ts` | Tạo/khóa tài khoản, danh mục, nhật ký truy cập |
| `04-man-hinh-demo.spec.ts` | Ảnh các màn hình chính với dữ liệu demo (cho báo cáo, slide) |
| `05-ket-qua-tu-dong.spec.ts` | Ảnh kết quả Jest, coverage, k6 dựng từ file kết quả thật |

## Chạy

1. Dựng stack demo sạch (cổng 8081, CSDL riêng) và nạp dữ liệu demo:

```bash
HTTP_PORT=8081 docker compose -p pt-demo -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

```bash
HTTP_PORT=8081 docker compose -p pt-demo -f deploy/docker-compose.yml --env-file deploy/.env exec api sh -c "npx prisma db seed && npx ts-node prisma/seed-demo.ts"
```

2. (Tuỳ chọn, cho `05-ket-qua-tu-dong`) xuất kết quả Jest và coverage:

```bash
pnpm --filter @pt/api exec jest --json --outputFile=../../e2e/.evidence-input/unit.json
```

```bash
pnpm --filter @pt/api exec jest --config ./test/jest-e2e.json --json --outputFile=../../e2e/.evidence-input/e2e.json
```

3. Cài trình duyệt (lần đầu) và chạy, với `E2E_SEED_PASSWORD` là `SEED_PASSWORD` trong `deploy/.env`:

```bash
pnpm --filter @pt/e2e exec playwright install chromium
```

```bash
E2E_SEED_PASSWORD=<mật khẩu> pnpm test:ui
```

TC-41 (tự đăng xuất sau 30 phút) dùng đồng hồ giả của Playwright để tua nhanh, không phải chờ thật.
Các kịch bản tạo thêm dữ liệu (bệnh nhân, người nhà mới) trong stack demo mỗi lần chạy.
