/**
 * Standalone mock of the Procraft API used by the profiles Next.js server
 * for SSR fetches (Playwright route interception cannot reach server-side
 * requests). Port 4801, started automatically by playwright.config.ts.
 */
import http from 'node:http';
import { publicProfile } from '../fixtures/data.mjs';

const PORT = 4801;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };

  if (url.pathname === '/api/health') {
    return send(200, { status: 'Healthy' });
  }

  const profileMatch = url.pathname.match(/^\/api\/profile\/([^/]+)$/);
  if (req.method === 'GET' && profileMatch) {
    const username = decodeURIComponent(profileMatch[1]);
    if (username === publicProfile.username) {
      return send(200, publicProfile);
    }
    return send(404, { message: 'Profile not found' });
  }

  if (req.method === 'POST' && url.pathname === '/api/analytics/track') {
    return send(204);
  }

  return send(404, { message: `Unmocked route: ${req.method} ${url.pathname}` });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock-api listening on http://127.0.0.1:${PORT}`);
});
