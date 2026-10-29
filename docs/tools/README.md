# Công cụ tạo tài liệu

Sinh lại các file trong `docs/` từ dữ liệu nguồn ở thư mục này. Sửa nội dung ở đây rồi chạy lại, không sửa tay file Excel/Word.

| Lệnh (chạy từ gốc repo) | Tạo ra |
|---|---|
| `python docs/tools/excel/make_xlsx.py` | `docs/kiem-thu/Ket-qua-kiem-thu.xlsx` (test case, bug log) |
| `python docs/tools/excel/make_pm.py` | `docs/quan-ly/Quan-ly-du-an.xlsx` (backlog, sprint, nhật ký) |
| `npm ci --prefix docs/tools/bao-cao` rồi `node docs/tools/bao-cao/build.js` | `docs/bao-cao/Bao-cao-CDTN2.docx` |
| `powershell -ExecutionPolicy Bypass -File docs/tools/bao-cao/muc-luc-pdf.ps1` | Cập nhật mục lục bằng Word, xuất `Bao-cao-CDTN2.pdf` |

Yêu cầu: Python 3 + `openpyxl`; Node.js; Microsoft Word (chỉ cho bước mục lục/PDF).

## Dữ liệu nguồn

- `excel/tc_data.py`, `tc_extra.py`, `tc_v2.py` — test case (tc_v2 thay nội dung theo cách đăng nhập mới, giữ nguyên mã TC)
- `excel/bug_data.py` — bug log; `excel/backlog_data.py` — backlog, sprint, nhật ký
- `bao-cao/c0.js` … `c8.js` — từng chương báo cáo; `lib.js` — định dạng chung, chèn ảnh từ `docs/`

Ảnh minh chứng lấy từ `docs/kiem-thu/anh/` và `docs/bao-cao/hinh/` (chụp bằng Playwright, xem `e2e/tests/05-*.spec.ts`, `06-so-do.spec.ts`).
