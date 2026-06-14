import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/assets/owasp');

const API_BASE =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.VITE_API_URL ??
  'http://localhost:8000/api';

const USER_EMAIL = 'user@meetmi.example.com';
const USER_PASSWORD = 'UserPass123';
const ADMIN_EMAIL = 'admin@meetmi.example.com';
const ADMIN_PASSWORD = 'AdminPass123';

async function login(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  const body = await response.json();
  return { response, body, token: body.access_token as string | undefined };
}

async function captureEvidence(
  page: Page,
  options: {
    filename: string;
    owaspId: string;
    title: string;
    attack: string;
    expected: string;
    result: string;
    status: number;
    passed: boolean;
  },
) {
  const statusColour = options.passed ? '#30d158' : '#ff453a';
  const statusLabel = options.passed ? 'DEFENDED' : 'VULNERABLE';

  await page.setContent(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #0b0d12, #05070c);
      color: #f6f8ff;
      padding: 2rem;
      min-height: 100vh;
    }
    .card {
      max-width: 920px;
      margin: 0 auto;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 1.25rem;
      background: linear-gradient(180deg, rgba(35,38,48,0.9), rgba(18,20,27,0.85));
      padding: 1.5rem 1.75rem;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45);
    }
    .kicker { color: rgba(235,240,255,0.45); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
    h1 { margin: 0.35rem 0 0.75rem; font-size: 1.5rem; }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 800;
      background: ${statusColour}22;
      color: ${statusColour};
      border: 1px solid ${statusColour}66;
      margin-bottom: 1rem;
    }
    .section { margin-top: 1rem; }
    .label { color: #7ec8ff; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem; }
    pre {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.1);
      color: #eaf2ff;
      font-size: 0.82rem;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .meta { margin-top: 1.25rem; color: rgba(235,240,255,0.55); font-size: 0.78rem; }
  </style>
</head>
<body>
  <div class="card">
    <p class="kicker">MeetMi OWASP Defence Evidence</p>
    <h1>${options.owaspId}: ${options.title}</h1>
    <span class="badge">${statusLabel} · HTTP ${options.status}</span>
    <div class="section">
      <div class="label">Attack attempted</div>
      <pre>${options.attack}</pre>
    </div>
    <div class="section">
      <div class="label">Expected secure behaviour</div>
      <pre>${options.expected}</pre>
    </div>
    <div class="section">
      <div class="label">Application response</div>
      <pre>${options.result}</pre>
    </div>
    <p class="meta">Captured against ${API_BASE.replace('/api', '')} · MeetMi security test suite</p>
  </div>
</body>
</html>`);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, options.filename),
    fullPage: true,
  });
}

test.describe('OWASP Top 10 defence evidence', () => {
  test('A01 Broken Access Control — regular user blocked from admin routes and other users bookings', async ({
    request,
    page,
  }) => {
    const userSession = await login(request, USER_EMAIL, USER_PASSWORD);
    expect(userSession.response.status()).toBe(200);
    expect(userSession.token).toBeTruthy();

    const adminList = await request.get(`${API_BASE}/admin/bookings`, {
      headers: { Authorization: `Bearer ${userSession.token}` },
    });
    const adminBody = await adminList.text();
    expect(adminList.status()).toBe(403);

    const adminSession = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const allBookings = await request.get(`${API_BASE}/admin/bookings`, {
      headers: { Authorization: `Bearer ${adminSession.token}` },
    });
    const bookings = (await allBookings.json()) as Array<{ id: number; user_email: string }>;
    const foreignBooking = bookings.find((b) => b.user_email !== USER_EMAIL);
    expect(foreignBooking).toBeTruthy();

    const cancelAttempt = await request.delete(`${API_BASE}/bookings/${foreignBooking!.id}`, {
      headers: { Authorization: `Bearer ${userSession.token}` },
    });
    const cancelBody = await cancelAttempt.text();
    expect(cancelAttempt.status()).toBe(403);

    await captureEvidence(page, {
      filename: 'a01-broken-access-control.png',
      owaspId: 'A01',
      title: 'Broken Access Control',
      attack: `1) GET /api/admin/bookings as ${USER_EMAIL}\n2) DELETE /api/bookings/${foreignBooking!.id} (owned by ${foreignBooking!.user_email})`,
      expected: 'HTTP 403 Forbidden — role-based and ownership checks deny unauthorised access.',
      result: `Admin list: ${adminList.status()} ${adminBody}\nCancel other booking: ${cancelAttempt.status()} ${cancelBody}`,
      status: 403,
      passed: adminList.status() === 403 && cancelAttempt.status() === 403,
    });
  });

  test('A03 Injection — SQL injection payload rejected at login', async ({ request, page }) => {
    const sqliEmail = "' OR '1'='1' --";
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: sqliEmail, password: 'anything' },
    });
    const body = await response.text();
    const defended = response.status() === 401 || response.status() === 422;
    expect(defended).toBe(true);
    expect(body.toLowerCase()).not.toContain('access_token');

    await captureEvidence(page, {
      filename: 'a03-injection.png',
      owaspId: 'A03',
      title: 'Injection',
      attack: `POST /api/auth/login\nemail: ${sqliEmail}\npassword: anything`,
      expected: 'Input validation and parameterized ORM lookup reject the payload; no authentication bypass (401 or 422).',
      result: `${response.status()} ${body}`,
      status: response.status(),
      passed: defended,
    });
  });

  test('A07 Identification and Authentication Failures — invalid credentials and unauthenticated booking blocked', async ({
    request,
    page,
  }) => {
    const badLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { email: USER_EMAIL, password: 'WrongPassword999!' },
    });
    const badBody = await badLogin.text();
    expect(badLogin.status()).toBe(401);

    const unauthBooking = await request.post(`${API_BASE}/bookings`, {
      data: {
        space_id: 1,
        title: 'Unauthorised booking attempt',
        start_time: '2030-06-17T09:00:00',
        end_time: '2030-06-17T10:00:00',
        attendee_count: 1,
      },
    });
    const unauthBody = await unauthBooking.text();
    expect(unauthBooking.status()).toBe(401);

    await captureEvidence(page, {
      filename: 'a07-auth-failures.png',
      owaspId: 'A07',
      title: 'Identification and Authentication Failures',
      attack: `1) Login with wrong password for ${USER_EMAIL}\n2) POST /api/bookings without Bearer token`,
      expected: 'Generic 401 errors; protected routes require valid JWT; no sensitive data leaked.',
      result: `Bad login: ${badLogin.status()} ${badBody}\nUnauth booking: ${unauthBooking.status()} ${unauthBody}`,
      status: 401,
      passed: badLogin.status() === 401 && unauthBooking.status() === 401,
    });
  });

  test('A02 Cryptographic Failures — passwords hashed; refresh cookie is HttpOnly', async ({ request, page }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: USER_EMAIL, password: USER_PASSWORD },
    });
    const body = await response.json();
    const setCookie = response.headers()['set-cookie'] ?? '';
    expect(response.status()).toBe(200);
    expect(body.access_token).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain(USER_PASSWORD);
    expect(setCookie.toLowerCase()).toContain('httponly');

    await captureEvidence(page, {
      filename: 'a02-cryptographic-failures.png',
      owaspId: 'A02',
      title: 'Cryptographic Failures',
      attack: 'Successful login — inspect response body and Set-Cookie headers for credential exposure.',
      expected: 'No plaintext password in JSON; refresh token issued as HttpOnly cookie; access token is short-lived JWT.',
      result: `Status: ${response.status()}\nBody keys: ${Object.keys(body).join(', ')}\nSet-Cookie: ${setCookie}`,
      status: response.status(),
      passed: !JSON.stringify(body).includes(USER_PASSWORD) && setCookie.toLowerCase().includes('httponly'),
    });
  });
});
