import type { Page, Route } from '@playwright/test';

import {
  analyticsSummary,
  pdfBytes,
  profile,
  publicProfile,
  templates,
  user,
} from '../fixtures/data.mjs';

export interface MockApiState {
  authenticated: boolean;
  user: typeof user;
  profile: typeof profile | null;
  /** request log: `${method} ${pathname}` */
  calls: string[];
  /** when true, the next /profile/me request 401s once (refresh-flow test) */
  failNextMeWith401: boolean;
}

export function createState(overrides: Partial<MockApiState> = {}): MockApiState {
  return {
    authenticated: false,
    user: { ...user },
    profile: { ...profile },
    calls: [],
    failNextMeWith401: false,
    ...overrides,
  };
}

const CSRF_COOKIE = 'procraft_csrf=e2e-csrf-token; Path=/; SameSite=Lax';

/**
 * Intercepts every browser-side API request (both relative `/api/...` and
 * absolute `https://api.procraft.uz/api/...`) and serves the documented
 * backend contract deterministically. No real backend is touched.
 */
export async function mockApi(page: Page, state: MockApiState): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    state.calls.push(`${method} ${path}`);

    const json = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: body === undefined ? '' : JSON.stringify(body),
      });

    // --- auth ---------------------------------------------------------
    if (path === '/auth/csrf') {
      return json(204, undefined, { 'Set-Cookie': CSRF_COOKIE });
    }

    if (method === 'POST' && path === '/auth/login') {
      const body = request.postDataJSON() as { emailOrUsername?: string; password?: string };
      if (body?.password === 'wrong-password') {
        return json(401, { message: 'Invalid credentials' });
      }
      state.authenticated = true;
      return json(200, { user: state.user });
    }

    if (method === 'POST' && path === '/auth/register') {
      return json(200, { verificationId: 'e2e-verification-id', maskedEmail: 'e2***@procraft.uz' });
    }

    if (method === 'POST' && path === '/auth/register/verify') {
      const body = request.postDataJSON() as { code?: string };
      if (body?.code !== '1234') {
        return json(400, { message: 'Register verification code is invalid or expired' });
      }
      state.authenticated = true;
      return json(200, { user: state.user });
    }

    if (method === 'POST' && path === '/auth/logout') {
      state.authenticated = false;
      return json(200, {});
    }

    if (method === 'POST' && path === '/auth/refresh') {
      if (!state.authenticated) {
        return json(401, { message: 'Not authenticated' });
      }
      return json(200, {});
    }

    if (path === '/auth/me') {
      if (!state.authenticated) {
        return json(401, { message: 'Not authenticated' });
      }
      return json(200, { user: state.user });
    }

    if (method === 'PUT' && path === '/auth/account') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.user = { ...state.user, ...body };
      return json(200, { user: state.user });
    }

    // --- profile (own) --------------------------------------------------
    if (path === '/profile/me') {
      if (state.failNextMeWith401) {
        // One-shot 401: exercises the interceptor's refresh-and-retry path.
        state.failNextMeWith401 = false;
        return json(401, { message: 'Not authenticated' });
      }
      if (!state.authenticated || !state.profile) {
        return json(401, { message: 'Not authenticated' });
      }
      return json(200, state.profile);
    }

    if (method === 'PUT' && path === '/profile') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.profile = { ...(state.profile as typeof profile), ...body };
      return json(200, state.profile);
    }

    if (method === 'POST' && path === '/profile') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.profile = { ...(profile as typeof profile), ...body };
      return json(200, state.profile);
    }

    const templateSelect = path.match(/^\/profile\/template\/([^/]+)$/);
    if (method === 'POST' && templateSelect) {
      const selected = templates.find((t) => t.id === decodeURIComponent(templateSelect[1]));
      if (selected && state.profile) {
        state.profile = { ...state.profile, templateId: selected.id, templateSlug: selected.slug };
      }
      return json(200, state.profile);
    }

    // --- profile sections ------------------------------------------------
    const sections: Record<string, unknown[]> = {
      '/profile/skills': state.profile?.skills ?? [],
      '/profile/skill-categories': [{ id: 'cat1', name: 'QA' }],
      '/profile/projects': state.profile?.projects ?? [],
      '/profile/experiences': state.profile?.workExperiences ?? [],
      '/profile/educations': state.profile?.educations ?? [],
      '/profile/certificates': state.profile?.certificates ?? [],
      '/profile/social-links': state.profile?.socialLinks ?? [],
      '/profile/custom-sections': [],
    };
    if (method === 'GET' && path in sections) {
      return json(200, sections[path]);
    }
    if (method === 'POST' && path in sections) {
      return json(200, { id: 'new-item', ...(request.postDataJSON() as object) });
    }

    // --- templates / analytics / pdf / subscription -----------------------
    if (method === 'GET' && path === '/templates') {
      return json(200, templates);
    }

    if (method === 'GET' && path === '/analytics/summary') {
      return json(200, analyticsSummary);
    }

    if (method === 'POST' && path === '/analytics/track') {
      return json(204);
    }

    if (method === 'GET' && path === '/pdf/download') {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: pdfBytes,
      });
    }

    if (method === 'GET' && path === '/subscriptions/me') {
      return json(200, { plan: 'free' });
    }

    // --- public profile (client-side fallback for legacy SPA) -------------
    const publicMatch = path.match(/^\/profile\/([^/]+)$/);
    if (method === 'GET' && publicMatch) {
      const username = decodeURIComponent(publicMatch[1]);
      if (username === publicProfile.username) {
        return json(200, publicProfile);
      }
      return json(404, { message: 'Profile not found' });
    }

    return json(404, { message: `Unmocked route: ${method} ${path}` });
  });
}

/** Marks the browser session as "previously logged in" (legacy parity: the
 *  session hint in localStorage gates the /auth/me bootstrap call). */
export async function seedSessionHint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('procraft.authSessionHint', '1');
  });
}
