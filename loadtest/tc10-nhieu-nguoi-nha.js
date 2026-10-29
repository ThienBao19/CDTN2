// TC-10 / NFR-01 / NFR-02: nhiều người nhà cùng theo dõi một ca khi trạng thái thay đổi.
// Chạy: xem loadtest/README.md
import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const FAMILIES = Number(__ENV.FAMILIES || 100);
const STAFF_EMAIL = __ENV.STAFF_EMAIL || 'nhanvien1@benhvien.test';
const STAFF_PASSWORD = __ENV.STAFF_PASSWORD;
const STEPS = ['PREPARING', 'IN_SURGERY', 'RECOVERING', 'COMPLETED'];
const STEP_GAP_S = 8;
const PATIENT_NAME = 'Bệnh nhân Tải Thử';

// Thời gian từ lúc thông báo được tạo tới lúc người nhà thấy (giới hạn trên, poll 1 giây)
const notifyVisible = new Trend('notify_visible_ms', true);
const statusChange = new Trend('status_change_ms', true);

export const options = {
  setupTimeout: '10m',
  scenarios: {
    families: {
      executor: 'per-vu-iterations',
      vus: FAMILIES,
      iterations: 1,
      maxDuration: '3m',
      exec: 'family',
    },
    staff: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      startTime: '5s',
      maxDuration: '3m',
      exec: 'staffFlow',
    },
  },
  thresholds: {
    notify_visible_ms: ['p(95)<5000'],
    'http_req_duration{name:status_view}': ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const auth = (token, name) => ({
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  tags: { name },
});

function post(path, body, token, name) {
  const params = token ? auth(token, name) : { headers: { 'Content-Type': 'application/json' }, tags: { name } };
  return http.post(`${BASE}/api${path}`, JSON.stringify(body), params);
}

// Bước chuẩn bị phải thành công; lỗi thì dừng kèm nội dung để dễ tìm nguyên nhân
function must(res, status, what) {
  if (res.status !== status) throw new Error(what + ' lỗi ' + res.status + ': ' + res.body);
  return res;
}

function login(identifier, password) {
  return must(post('/auth/login', { identifier, password }, null, 'login'), 200, 'Đăng nhập').json('accessToken');
}

export function setup() {
  if (!STAFF_PASSWORD) throw new Error('Thiếu STAFF_PASSWORD');
  const staff = login(STAFF_EMAIL, STAFF_PASSWORD);
  const run = Date.now();
  const patient = must(post('/patients', {
    patientCode: `LT-${run}`.slice(0, 20),
    fullName: 'Bệnh nhân Tải Thử',
    dateOfBirth: '1970-01-01',
    gender: 'MALE',
  }, staff, 'setup'), 201, 'Tạo bệnh nhân').json('id');
  const surgeryId = must(post('/surgeries', {
    patientId: patient,
    title: 'Ca thử tải',
    scheduledAt: new Date().toISOString(),
  }, staff, 'setup'), 201, 'Tạo ca').json('id');

  const families = [];
  // Nhân viên đăng ký từng người nhà (SĐT + họ tên); người nhà vào xem bằng 3 thông tin, không mật khẩu
  const phonePrefix = String(run).slice(-4);
  for (let i = 0; i < FAMILIES; i += 1) {
    const contact = { phone: `09${phonePrefix}${String(i).padStart(4, '0')}`, fullName: `Người Nhà ${i}` };
    must(post(`/surgeries/${surgeryId}/family-contacts`, contact, staff, 'setup'), 201, 'Đăng ký người nhà');
    const res = post('/auth/family-access', { ...contact, patientName: PATIENT_NAME }, null, 'setup');
    families.push(must(res, 200, 'Người nhà vào xem').json('accessToken'));
  }
  return { staff, surgeryId, families };
}

export function family(data) {
  const token = data.families[exec.scenario.iterationInTest];
  const deadline = Date.now() + (STEPS.length * STEP_GAP_S + 30) * 1000;
  let seen = 0;
  while (seen < STEPS.length && Date.now() < deadline) {
    const res = http.get(`${BASE}/api/my/notifications`, auth(token, 'notifications'));
    if (res.status === 200) {
      const items = res.json('items');
      const fresh = items.slice(0, Math.max(0, items.length - seen));
      fresh.forEach((n) => notifyVisible.add(Date.now() - Date.parse(n.createdAt)));
      seen = items.length;
    }
    http.get(`${BASE}/api/my/surgeries/${data.surgeryId}`, auth(token, 'status_view'));
    sleep(1);
  }
  check(seen, { 'người nhà nhận đủ 4 thông báo': (s) => s === STEPS.length });
}

export function staffFlow(data) {
  for (const statusCode of STEPS) {
    const res = post(`/surgeries/${data.surgeryId}/status`, { statusCode }, data.staff, 'status_change');
    statusChange.add(res.timings.duration);
    check(res, { 'đổi trạng thái thành công': (r) => r.status === 201 });
    sleep(STEP_GAP_S);
  }
}
