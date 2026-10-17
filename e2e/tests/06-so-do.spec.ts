import { test } from '@playwright/test';
import path from 'node:path';

// Sơ đồ cho báo cáo (Mermaid), lưu vào docs/bao-cao/hinh
const OUT = path.resolve(__dirname, '../../docs/bao-cao/hinh');
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';

const DIAGRAMS: Record<string, string> = {
  'kien-truc': `flowchart LR
  FAM["Người nhà<br/>PWA trên điện thoại"]
  STF["Nhân viên y tế<br/>Web"]
  ADM["Quản trị viên<br/>Web"]
  subgraph DOCKER["Docker Compose"]
    NGX["nginx<br/>cổng vào duy nhất"]
    WEB["Next.js<br/>giao diện"]
    API["NestJS API<br/>REST + SSE"]
    DB[("PostgreSQL")]
    BK["Sao lưu<br/>pg_dump hằng ngày"]
  end
  FCM["Firebase Cloud<br/>Messaging"]
  FAM & STF & ADM -->|HTTP| NGX
  NGX -->|"/"| WEB
  NGX -->|"/api, /api/events"| API
  API -->|Prisma| DB
  BK --> DB
  API -->|push| FCM
  FCM -.->|thông báo| FAM`,
  'erd': `erDiagram
  users ||--o{ family_links : "theo dõi"
  users ||--o{ device_tokens : "nhận push"
  users ||--o{ notifications : "nhận"
  users ||--o{ status_history : "cập nhật"
  users ||--o{ audit_logs : "thao tác"
  patients ||--o{ surgeries : "có"
  rooms |o--o{ surgeries : "diễn ra tại"
  status_definitions ||--o{ surgeries : "trạng thái hiện tại"
  status_definitions ||--o{ status_history : "trạng thái"
  surgeries ||--o{ status_history : "lịch sử"
  surgeries ||--o{ tracking_codes : "mã theo dõi"
  surgeries ||--o{ family_links : "liên kết"
  surgeries ||--o{ notifications : "thông báo"
  tracking_codes ||--o{ family_links : "dùng để liên kết"
  users { uuid id PK
    string role
    int token_version }
  surgeries { uuid id PK
    uuid patient_id FK
    int current_status_id FK
    datetime scheduled_at }
  status_history { uuid id PK
    uuid surgery_id FK
    int status_id FK
    datetime changed_at
    bool is_override }
  tracking_codes { uuid id PK
    string code_hash UK
    datetime expires_at
    string status }
  family_links { uuid id PK
    uuid user_id FK
    uuid surgery_id FK
    string status }`,
  'luong-thong-bao': `sequenceDiagram
  autonumber
  participant NV as Nhân viên
  participant API as API (NestJS)
  participant DB as PostgreSQL
  participant SSE as Kênh SSE
  participant FCM as Firebase CM
  participant NN as Người nhà
  NV->>API: POST /surgeries/:id/status
  API->>API: Kiểm tra quyền và thứ tự (BR-01)
  API->>DB: Giao dịch: cập nhật trạng thái + thêm lịch sử
  API->>DB: Tạo thông báo cho liên kết còn hiệu lực (BR-05)
  API-->>NV: 201 Đã cập nhật
  API->>SSE: surgery.updated, notification.created
  SSE-->>NN: Màn hình đang mở cập nhật ngay
  API->>FCM: Gửi push (nền, thử lại tối đa 3 lần)
  FCM-->>NN: Thông báo trên màn hình khóa`,
};

test.describe('Sơ đồ báo cáo', () => {
  test.use({ viewport: { width: 1200, height: 200 }, deviceScaleFactor: 2 });
  for (const [name, source] of Object.entries(DIAGRAMS)) {
    test(name, async ({ page }) => {
      await page.setContent(`<html><body style="margin:0;background:#fff">
        <pre class="mermaid" style="margin:16px">${source}</pre></body></html>`);
      await page.addScriptTag({ url: MERMAID });
      await page.evaluate(async () => {
        const m = (window as unknown as { mermaid: { initialize(o: object): void; run(): Promise<void> } }).mermaid;
        m.initialize({
          startOnLoad: false,
          theme: 'neutral',
          fontFamily: 'Arial',
          themeVariables: { fontSize: '18px' },
          sequence: { actorFontSize: 17, messageFontSize: 17, noteFontSize: 16, wrap: true, width: 170 },
        });
        await m.run();
      });
      await page.locator('pre.mermaid svg').screenshot({ path: path.join(OUT, `${name}.png`) });
    });
  }
});
