import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { evidence } from './helpers';

// Ảnh minh chứng cho kết quả test tự động (Jest, coverage, k6): dựng từ file kết quả thật
const INPUT = path.resolve(__dirname, '../.evidence-input');
const LOADTEST = path.resolve(__dirname, '../../loadtest');

type JestResult = {
  numPassedTests: number;
  numTotalTests: number;
  testResults: Array<{ name: string; assertionResults: Array<{ fullName: string; status: string; duration?: number }> }>;
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);

function terminal(title: string, body: string): string {
  return `<html><body style="margin:0;background:#0b1220;color:#e2e8f0;font:14px/1.5 Consolas,monospace">
  <div style="padding:20px 24px"><div style="color:#7dd3fc;font-weight:bold;margin-bottom:12px">${esc(title)}</div>${body}</div></body></html>`;
}

function jestHtml(result: JestResult): string {
  const files = result.testResults.map((file) => {
    const name = path.relative(path.resolve(__dirname, '../../apps/api'), file.name).split(path.sep).join('/');
    const lines = file.assertionResults
      .map((t) => {
        const ok = t.status === 'passed';
        return `<div style="color:${ok ? '#86efac' : '#fca5a5'}">  ${ok ? '✓' : '✕'} ${esc(t.fullName)} <span style="color:#64748b">(${t.duration ?? 0} ms)</span></div>`;
      })
      .join('');
    return `<div style="margin-top:8px"><span style="background:#16a34a;color:#fff;padding:0 6px">PASS</span> ${esc(name)}</div>${lines}`;
  });
  const summary = `<div style="margin-top:14px;font-weight:bold">Tests: <span style="color:#86efac">${result.numPassedTests} passed</span>, ${result.numTotalTests} total</div>`;
  return files.join('') + summary;
}

function k6Html(file: string): string {
  const m = JSON.parse(fs.readFileSync(file, 'utf8')).metrics as Record<string, Record<string, unknown>>;
  const ms = (v: unknown) => `${Math.round(Number(v))} ms`;
  const rows: Array<[string, string, string]> = [
    ['Thông báo tới người nhà (p95)', ms(m.notify_visible_ms['p(95)']), '< 5000 ms (NFR-01)'],
    ['Tải màn hình trạng thái (p95)', ms(m['http_req_duration{name:status_view}']['p(95)']), '< 2000 ms (NFR-02)'],
    ['Đổi trạng thái kèm tạo thông báo (p95)', ms(m.status_change_ms['p(95)']), '—'],
    ['Tổng request / tốc độ', `${String(m.http_reqs.count)} / ${Math.round(Number(m.http_reqs.rate))} req/s`, '—'],
    ['Request lỗi', `${String(m.http_req_failed.passes)}`, '< 1%'],
    ['Kiểm tra đạt (checks)', `${String(m.checks.passes)}/${Number(m.checks.passes) + Number(m.checks.fails)}`, '> 99%'],
  ];
  const tr = rows
    .map(([a, b, c]) => `<tr><td style="padding:4px 16px 4px 0">${a}</td><td style="color:#86efac;padding-right:16px">${b}</td><td style="color:#94a3b8">${c}</td></tr>`)
    .join('');
  return `<table style="border-collapse:collapse">${tr}</table><div style="margin-top:12px;color:#86efac">✓ Tất cả ngưỡng (thresholds) đều đạt</div>`;
}

test.describe('Ảnh kết quả test tự động', () => {
  test.skip(!fs.existsSync(INPUT), 'Chưa có e2e/.evidence-input (xem e2e/README.md)');
  // Khung thấp để ảnh vừa nội dung (fullPage tự kéo dài theo nội dung)
  test.use({ viewport: { width: 1100, height: 120 } });

  test('KQ-01, KQ-02: unit test và e2e test API', async ({ page }) => {
    for (const [file, name, title] of [
      ['unit.json', 'KQ-01-unit-test', 'pnpm --filter @pt/api test'],
      ['e2e.json', 'KQ-02-e2e-test', 'pnpm --filter @pt/api test:e2e'],
    ]) {
      const result = JSON.parse(fs.readFileSync(path.join(INPUT, file), 'utf8')) as JestResult;
      await page.setContent(terminal(`$ ${title}`, jestHtml(result)));
      await evidence(page, name);
    }
  });

  test('KQ-03: coverage gộp unit + e2e', async ({ page }) => {
    const table = fs.readFileSync(path.join(INPUT, 'coverage-files.txt'), 'utf8');
    const summary = fs.readFileSync(path.join(INPUT, 'coverage.txt'), 'utf8');
    await page.setContent(terminal('$ pnpm --filter @pt/api test:cov:all', `<pre style="margin:0">${esc(table)}\n${esc(summary)}</pre>`));
    await evidence(page, 'KQ-03-coverage');
  });

  test('KQ-04, KQ-05: thử tải k6 với 100 và 500 người nhà', async ({ page }) => {
    for (const [file, name, n] of [
      ['ket-qua-tc10.json', 'KQ-04-k6-100-nguoi-nha', '100'],
      ['ket-qua-nfr03-500.json', 'KQ-05-k6-500-nguoi-nha', '500'],
    ]) {
      await page.setContent(terminal(`$ k6 run tc10-nhieu-nguoi-nha.js (FAMILIES=${n}, qua nginx)`, k6Html(path.join(LOADTEST, file))));
      await evidence(page, name);
    }
  });

  test('KQ-06, KQ-07: triển khai Docker và sao lưu/khôi phục', async ({ page }) => {
    for (const [file, name, title] of [
      ['docker.txt', 'KQ-06-trien-khai-docker', 'Triển khai bằng Docker Compose (stack demo, cổng 8081)'],
      ['backup.txt', 'KQ-07-sao-luu-khoi-phuc', 'Sao lưu tự động và khôi phục CSDL (NFR-11)'],
    ]) {
      const text = fs.readFileSync(path.join(INPUT, file), 'utf8');
      await page.setContent(terminal(title, '<pre style="margin:0;white-space:pre-wrap">' + esc(text) + '</pre>'));
      await evidence(page, name);
    }
  });
});
