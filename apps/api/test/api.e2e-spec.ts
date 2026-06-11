import 'reflect-metadata';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { createHmac } from 'crypto';

const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'procraft-e2e-uploads-'));

process.env.ASPNETCORE_ENVIRONMENT = 'Development';
process.env.ConnectionStrings__DefaultConnection =
  'Host=127.0.0.1;Port=54329;Database=procraft_test;Username=postgres;Password=e2e_test_password';
process.env.JWT_SECRET = 'procraft_e2e_secret_key_for_tests_only_0123456789';
process.env.JWT_ISSUER = 'procraft.e2e';
process.env.JWT_AUDIENCE = 'procraft.e2e';
process.env.JWT_ACCESS_MINUTES = '15';
process.env.JWT_REFRESH_DAYS = '7';
process.env.UPLOADS_ROOT = uploadsRoot;
process.env.Admin__Username = 'admin';
process.env.Admin__Password = 'admin-e2e-password';
process.env.Admin__SessionSecret = 'admin-e2e-session-secret';

import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import request = require('supertest');
import { resetConfigCache } from '../src/config/env';
resetConfigCache();

import { createConfiguredApp, runDatabaseStartup } from '../src/app.factory';

jest.setTimeout(120_000);

/** Minimal cookie jar for supertest. */
class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(res: request.Response): void {
    const setCookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : res.headers['set-cookie']
        ? [res.headers['set-cookie'] as unknown as string]
        : [];

    for (const raw of setCookies) {
      const [pair, ...attributes] = raw.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();

      const expired = attributes.some((attr) => {
        const trimmed = attr.trim().toLowerCase();
        if (!trimmed.startsWith('expires=')) {
          return false;
        }
        return new Date(trimmed.slice('expires='.length)).getTime() < Date.now();
      });

      if (expired || value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  delete(name: string): void {
    this.cookies.delete(name);
  }
}

function bruteForceCode(id: string, codeHash: string, secret: string): string {
  const guidN = id.replace(/-/g, '').toLowerCase();
  for (let i = 0; i < 10_000; i += 1) {
    const code = i.toString().padStart(4, '0');
    const hash = createHmac('sha256', Buffer.from(secret, 'utf8'))
      .update(Buffer.from(`${guidN}:${code}`, 'utf8'))
      .digest('hex')
      .toUpperCase();
    if (hash === codeHash) {
      return code;
    }
  }
  throw new Error('Verification code could not be recovered.');
}

describe('Procraft API (NestJS) — parity e2e', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let server: ReturnType<NestExpressApplication['getHttpServer']>;

  const jar = new CookieJar();

  const agentGet = (url: string) => request(server).get(url).set('Cookie', jar.header());
  const agentDelete = (url: string) =>
    request(server)
      .delete(url)
      .set('Cookie', jar.header())
      .set('X-CSRF-TOKEN', jar.get('procraft_csrf') ?? '');
  const agentPost = (url: string) =>
    request(server)
      .post(url)
      .set('Cookie', jar.header())
      .set('X-CSRF-TOKEN', jar.get('procraft_csrf') ?? '');
  const agentPut = (url: string) =>
    request(server)
      .put(url)
      .set('Cookie', jar.header())
      .set('X-CSRF-TOKEN', jar.get('procraft_csrf') ?? '');

  const user = {
    email: 'e2e.user@procraft.uz',
    username: 'e2euser',
    password: 'Sup3rSecurePass!',
  };

  beforeAll(async () => {
    app = await createConfiguredApp();
    await runDatabaseStartup(app, new Logger('E2E'));
    await app.init();
    dataSource = app.get(DataSource);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(uploadsRoot, { recursive: true, force: true });
  });

  describe('health', () => {
    it('GET /health returns {status:"Healthy"}', async () => {
      const res = await request(server).get('/health').expect(200);
      expect(res.body).toEqual({ status: 'Healthy' });
    });

    it('GET /api/health returns {status:"Healthy"}', async () => {
      const res = await request(server).get('/api/health').expect(200);
      expect(res.body).toEqual({ status: 'Healthy' });
    });
  });

  describe('EF-compatible migrations', () => {
    it('records all known EF migration ids in __EFMigrationsHistory', async () => {
      const rows: Array<{ MigrationId: string }> = await dataSource.query(
        'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId"',
      );
      const ids = rows.map((row) => row.MigrationId);
      expect(ids).toContain('20260504120000_CreateAuthTables');
      expect(ids).toContain('20260522110000_AddDeveloperTemplate');
      expect(ids).toHaveLength(16);
    });

    it('is idempotent — a second run applies nothing and touches no data', async () => {
      const { runEfCompatibleMigrations } = await import('../src/database/ef-migrations');
      const before = await dataSource.query('SELECT COUNT(*)::int AS count FROM "__EFMigrationsHistory"');
      await runEfCompatibleMigrations(dataSource, new Logger('E2E-rerun'));
      const after = await dataSource.query('SELECT COUNT(*)::int AS count FROM "__EFMigrationsHistory"');
      expect(after[0].count).toBe(before[0].count);
    });

    it('seeded the five templates', async () => {
      const rows: Array<{ Slug: string }> = await dataSource.query('SELECT "Slug" FROM templates ORDER BY "Slug"');
      expect(rows.map((row) => row.Slug)).toEqual(['classic', 'developer', 'editorial', 'minimal', 'modern']);
    });
  });

  describe('CSRF', () => {
    it('rejects unsafe requests without the token pair (403, C# payload shape)', async () => {
      const res = await request(server).post('/api/auth/login').send({}).expect(403);
      expect(res.body.title).toBe('CSRF validation failed');
      expect(res.body.detail).toContain('X-CSRF-TOKEN');
    });

    it('GET /api/auth/csrf issues the readable cookie and returns 204', async () => {
      const res = await request(server).get('/api/auth/csrf').expect(204);
      jar.absorb(res);
      expect(jar.get('procraft_csrf')).toMatch(/^[0-9A-F]{32}$/);
    });

    it('rejects a mismatched token (403 {"title":"CSRF token mismatch"})', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .set('Cookie', jar.header())
        .set('X-CSRF-TOKEN', 'DEADBEEFDEADBEEFDEADBEEFDEADBEEF')
        .send({ emailOrUsername: 'x', password: 'y' })
        .expect(403);
      expect(res.body).toEqual({ title: 'CSRF token mismatch' });
    });
  });

  describe('register flow', () => {
    let verificationId: string;

    it('POST /api/auth/register returns the challenge', async () => {
      const res = await agentPost('/api/auth/register')
        .send({ email: user.email, username: user.username, password: user.password, phoneNumber: '+998 90 123-45-67' })
        .expect(200);

      expect(res.body.verificationId).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body.maskedEmail).toBe('e***@procraft.uz');
      expect(res.body.codeLength).toBe(4);
      expect(typeof res.body.expiresAt).toBe('string');
      verificationId = res.body.verificationId;
    });

    it('rejects duplicate email with 409 Conflict shape', async () => {
      // Seeded static account owns this email in Development.
      const res = await agentPost('/api/auth/register')
        .send({ email: 'tulaganovraximjon65@gmail.com', username: 'someoneelse', password: 'password123' })
        .expect(409);
      expect(res.body).toEqual({ message: 'Conflict', errors: { email: ['Email is already taken'] } });
    });

    it('validation errors use the C# FluentValidation payload', async () => {
      const res = await agentPost('/api/auth/register')
        .send({ email: 'not-an-email', username: 'A', password: 'short' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.email).toEqual(["'Email' is not a valid email address."]);
      expect(res.body.errors.username).toContain(
        'Username may only contain lowercase letters, digits, hyphen, or underscore.',
      );
      expect(res.body.errors.password).toEqual([
        "The length of 'Password' must be at least 8 characters. You entered 5 characters.",
      ]);
    });

    it('wrong code increments attempts and stays 401', async () => {
      const res = await agentPost('/api/auth/register/verify')
        .send({ verificationId, code: '0000' })
        .expect((r: request.Response) => {
          if (r.status !== 401 && r.status !== 200) {
            throw new Error(`unexpected ${r.status}`);
          }
        });

      if (res.status === 401) {
        expect(res.body.message).toBe('Register verification code is invalid or expired.');
      }
    });

    it('correct code creates the account and sets auth cookies', async () => {
      const rows: Array<{ CodeHash: string }> = await dataSource.query(
        'SELECT "CodeHash" FROM pending_registrations WHERE "Id" = $1',
        [verificationId],
      );
      const code = bruteForceCode(verificationId, rows[0].CodeHash, process.env.JWT_SECRET!);

      const res = await agentPost('/api/auth/register/verify').send({ verificationId, code }).expect(200);
      jar.absorb(res);

      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.username).toBe(user.username);
      expect(res.body.user.phoneNumber).toBe('+998 90 123-45-67');
      expect(res.body.user.isEmailConfirmed).toBe(true);
      expect(jar.get('procraft_access')).toBeTruthy();
      expect(jar.get('procraft_refresh')).toBeTruthy();
    });

    it('GET /api/auth/me returns the user from the cookie token', async () => {
      const res = await agentGet('/api/auth/me').expect(200);
      expect(res.body.user.username).toBe(user.username);
    });
  });

  describe('login / refresh / logout', () => {
    it('rejects bad credentials with 401 {"message":"Invalid credentials."}', async () => {
      const res = await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.email, password: 'wrong-password' })
        .expect(401);
      expect(res.body).toEqual({ message: 'Invalid credentials.' });
    });

    it('logs in with email and rotating cookies', async () => {
      const res = await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.email.toUpperCase(), password: user.password })
        .expect(200);
      jar.absorb(res);
      expect(res.body.user.username).toBe(user.username);

      const setCookies = res.headers['set-cookie'] as unknown as string[];
      const accessCookie = setCookies.find((cookie) => cookie.startsWith('procraft_access='));
      expect(accessCookie).toContain('HttpOnly');
      expect(accessCookie).toContain('Path=/');
    });

    it('refresh rotates the refresh token and keeps the session', async () => {
      const before = jar.get('procraft_refresh');
      const res = await agentPost('/api/auth/refresh').expect(200);
      jar.absorb(res);
      expect(res.body.user.username).toBe(user.username);
      expect(jar.get('procraft_refresh')).not.toBe(before);
    });

    it('detects refresh token reuse and revokes the session family', async () => {
      const stolen = jar.get('procraft_refresh')!;

      const rotation = await agentPost('/api/auth/refresh').expect(200);
      jar.absorb(rotation);

      const reuse = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', `procraft_refresh=${stolen}; procraft_csrf=${jar.get('procraft_csrf')}`)
        .set('X-CSRF-TOKEN', jar.get('procraft_csrf') ?? '')
        .expect(401);
      expect(reuse.body).toEqual({ message: 'Refresh token reuse detected.' });

      // The reuse revoked everything: the "current" cookie is dead too.
      await agentPost('/api/auth/refresh').expect(401);

      const login = await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.username, password: user.password })
        .expect(200);
      jar.absorb(login);
    });

    it('logout revokes and clears cookies', async () => {
      const res = await agentPost('/api/auth/logout').expect(200);
      expect(res.body).toEqual({ message: 'Logged out successfully' });
      jar.absorb(res);

      await agentGet('/api/auth/me').expect(401);

      const login = await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.username, password: user.password })
        .expect(200);
      jar.absorb(login);
    });
  });

  describe('password reset flow', () => {
    it('forgot password always returns a challenge', async () => {
      const res = await agentPost('/api/auth/password/forgot').send({ email: 'unknown@procraft.uz' }).expect(200);
      expect(res.body.resetId).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body.codeLength).toBe(4);
    });

    it('resets the password with the emailed code and revokes sessions', async () => {
      const challenge = await agentPost('/api/auth/password/forgot').send({ email: user.email }).expect(200);
      const resetId = challenge.body.resetId;

      const rows: Array<{ CodeHash: string }> = await dataSource.query(
        'SELECT "CodeHash" FROM password_reset_codes WHERE "Id" = $1',
        [resetId],
      );
      const code = bruteForceCode(resetId, rows[0].CodeHash, process.env.JWT_SECRET!);

      const newPassword = 'Brand-New-Passw0rd!';
      const res = await agentPost('/api/auth/password/reset')
        .send({ resetId, code, newPassword })
        .expect(200);
      expect(res.body).toEqual({ message: 'Password reset successfully.' });

      await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.email, password: user.password })
        .expect(401);

      const login = await agentPost('/api/auth/login')
        .send({ emailOrUsername: user.email, password: newPassword })
        .expect(200);
      jar.absorb(login);
      user.password = newPassword;
    });
  });

  describe('profile', () => {
    it('GET /api/profile/me returns 404 before creation', async () => {
      const res = await agentGet('/api/profile/me').expect(404);
      expect(res.body).toEqual({ message: 'Profile not found.' });
    });

    it('creates a profile (sections empty on mutation responses)', async () => {
      const res = await agentPost('/api/profile')
        .send({ fullName: '  E2E Tester  ', title: 'QA Engineer', bio: 'Bio text', location: 'Tashkent' })
        .expect(200);

      expect(res.body.fullName).toBe('E2E Tester');
      expect(res.body.username).toBe(user.username);
      expect(res.body.templateSlug).toBe('minimal');
      expect(res.body.skills).toEqual([]);
      expect(res.body.updatedAt).toBeNull();
      expect(typeof res.body.createdAt).toBe('string');
      expect(res.body.createdAt).toMatch(/\+00:00$/);
    });

    it('rejects a second profile with 409', async () => {
      const res = await agentPost('/api/profile').send({ fullName: 'Another' }).expect(409);
      expect(res.body).toEqual({ message: 'Conflict', errors: { profile: ['Profile already exists.'] } });
    });

    it('updates the profile', async () => {
      const res = await agentPut('/api/profile')
        .send({ fullName: 'E2E Tester Updated', title: 'Senior QA', bio: null, location: '' })
        .expect(200);
      expect(res.body.fullName).toBe('E2E Tester Updated');
      expect(res.body.title).toBe('Senior QA');
      expect(res.body.bio).toBeNull();
      expect(res.body.location).toBeNull();
      expect(res.body.updatedAt).not.toBeNull();
    });

    it('selects a template by id and 404s for a non-guid id', async () => {
      const templates = await agentGet('/api/templates').expect(200);
      const modern = templates.body.find((template: { slug: string }) => template.slug === 'modern');

      const res = await agentPost(`/api/profile/template/${modern.id}`).expect(200);
      expect(res.body.templateSlug).toBe('modern');
      expect(res.body.templateId).toBe(modern.id);

      await agentPost('/api/profile/template/not-a-guid').expect(404);
    });

    it('serves the public profile with sections by username', async () => {
      const res = await request(server).get(`/api/profile/${user.username}`).expect(200);
      expect(res.body.fullName).toBe('E2E Tester Updated');
      expect(res.body.templateSlug).toBe('modern');
      expect(Array.isArray(res.body.skills)).toBe(true);
    });

    it('404s for an unknown username', async () => {
      const res = await request(server).get('/api/profile/no-such-user').expect(404);
      expect(res.body).toEqual({ message: 'Profile not found.' });
    });
  });

  describe('avatar upload', () => {
    it('uploads an avatar and exposes it under /uploads/avatars/', async () => {
      const res = await agentPost('/api/profile/avatar')
        .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]), {
          filename: 'avatar.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\/[0-9a-f]{32}\.png$/);

      await agentGet(res.body.avatarUrl).expect(200);
    });

    it('rejects disallowed types with the C# validation message', async () => {
      const res = await agentPost('/api/profile/avatar')
        .attach('file', Buffer.from('GIF89a'), { filename: 'avatar.gif', contentType: 'image/gif' })
        .expect(400);
      expect(res.body.errors.fileName).toContain('Avatar must be a JPG, JPEG, PNG, or WEBP image.');
    });

    it('replaces the previous file on re-upload and deletes it from disk', async () => {
      const first = await agentGet('/api/profile/me').expect(200);
      const firstUrl: string = first.body.avatarUrl;

      const res = await agentPost('/api/profile/avatar')
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 5, 6]), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(200);

      expect(res.body.avatarUrl).not.toBe(firstUrl);
      const firstPath = path.join(uploadsRoot, firstUrl.replace('/uploads/', ''));
      expect(fs.existsSync(firstPath)).toBe(false);
    });

    it('deletes the avatar', async () => {
      const res = await agentDelete('/api/profile/avatar').expect(200);
      expect(res.body.avatarUrl).toBeNull();
    });
  });

  describe('profile sections CRUD', () => {
    let skillId: string;

    it('skills: create, list ordering, update, delete', async () => {
      const created = await agentPost('/api/profile/skills')
        .send({ name: 'TypeScript', level: 5, category: 'Languages', sortOrder: 2 })
        .expect(200);
      skillId = created.body.id;
      expect(created.body.level).toBe(5);

      await agentPost('/api/profile/skills').send({ name: 'Go', level: 3, sortOrder: 1 }).expect(200);

      const list = await agentGet('/api/profile/skills').expect(200);
      expect(list.body.map((skill: { name: string }) => skill.name)).toEqual(['Go', 'TypeScript']);

      const badLevel = await agentPost('/api/profile/skills').send({ name: 'Rust', level: 9 }).expect(400);
      expect(badLevel.body.errors.level).toEqual(['Level must be between 1 and 5.']);

      const updated = await agentPut(`/api/profile/skills/${skillId}`)
        .send({ name: 'TypeScript 5', level: 4, category: 'Languages' })
        .expect(200);
      expect(updated.body.name).toBe('TypeScript 5');

      const missing = await agentPut(`/api/profile/skills/00000000-0000-0000-0000-00000000abcd`)
        .send({ name: 'X' })
        .expect(404);
      expect(missing.body).toEqual({ message: 'Skill not found.' });
    });

    it('skill categories: idempotent create by name', async () => {
      const first = await agentPost('/api/profile/skill-categories').send({ name: 'Backend' }).expect(200);
      const second = await agentPost('/api/profile/skill-categories').send({ name: 'Backend' }).expect(200);
      expect(second.body.id).toBe(first.body.id);
    });

    it('projects: full CRUD', async () => {
      const created = await agentPost('/api/profile/projects')
        .send({ name: 'Procraft', description: 'Portfolio builder', githubUrl: 'https://github.com/x/y', isRepositoryPrivate: true })
        .expect(200);
      expect(created.body.isRepositoryPrivate).toBe(true);

      const updated = await agentPut(`/api/profile/projects/${created.body.id}`)
        .send({ name: 'Procraft v2', isRepositoryPrivate: false, liveUrl: 'https://procraft.uz' })
        .expect(200);
      expect(updated.body.liveUrl).toBe('https://procraft.uz');

      const deleted = await agentDelete(`/api/profile/projects/${created.body.id}`).expect(200);
      expect(deleted.body.id).toBe(created.body.id);
    });

    it('experiences: date rules and isCurrent clearing endDate', async () => {
      const invalid = await agentPost('/api/profile/experiences')
        .send({ company: 'ACME', experienceType: 'work', position: 'Dev', startDate: '2024-05-01', endDate: '2024-01-01', isCurrent: false })
        .expect(400);
      expect(invalid.body.errors.endDate).toEqual(['End date must be greater than or equal to start date.']);

      const created = await agentPost('/api/profile/experiences')
        .send({ company: 'ACME', experienceType: 'weird-type', position: 'Dev', startDate: '2024-05-01', endDate: '2024-12-01', isCurrent: true })
        .expect(400);
      // unknown experienceType fails the Must rule like C#
      expect(created.body.errors.experienceType).toBeDefined();

      const ok = await agentPost('/api/profile/experiences')
        .send({ company: 'ACME', experienceType: 'freelance', position: 'Dev', startDate: '2024-05-01', endDate: '2024-12-01', isCurrent: true })
        .expect(200);
      expect(ok.body.endDate).toBeNull();
      expect(ok.body.startDate).toBe('2024-05-01');
      expect(ok.body.experienceType).toBe('freelance');
    });

    it('educations: optional dates and type normalization', async () => {
      const res = await agentPost('/api/profile/educations')
        .send({ institution: 'TUIT', educationType: 'FORMAL', degree: 'BSc', field: 'CS', startDate: '2018-09-01', endDate: '2022-06-01' })
        .expect(200);
      expect(res.body.educationType).toBe('formal');
    });

    it('certificates: JSON create + multipart file upload', async () => {
      const json = await agentPost('/api/profile/certificates')
        .send({ name: 'AWS SAA', issuer: 'Amazon', issuedOn: '2025-03-15', url: 'https://aws.amazon.com/cert' })
        .expect(200);
      expect(json.body.issuedOn).toBe('2025-03-15');

      const multipart = await agentPost('/api/profile/certificates')
        .field('name', 'PDF Cert')
        .field('sortOrder', '3')
        .attach('file', Buffer.from('%PDF-1.7 fake'), { filename: 'cert.pdf', contentType: 'application/pdf' })
        .expect(200);
      expect(multipart.body.url).toMatch(/^\/uploads\/certificates\/[0-9a-f]{32}\.pdf$/);
      expect(multipart.body.sortOrder).toBe(3);

      const fileOnly = await agentPost('/api/profile/certificates/file')
        .attach('file', Buffer.from([1, 2, 3]), { filename: 'scan.webp', contentType: 'image/webp' })
        .expect(200);
      expect(fileOnly.body.url).toMatch(/^\/uploads\/certificates\//);
    });

    it('social links + custom sections CRUD', async () => {
      const link = await agentPost('/api/profile/social-links')
        .send({ platform: 'GitHub', url: 'https://github.com/e2euser' })
        .expect(200);
      expect(link.body.platform).toBe('GitHub');

      const section = await agentPost('/api/profile/custom-sections')
        .send({ title: 'Hobbies', content: 'Chess, running' })
        .expect(200);
      expect(section.body.title).toBe('Hobbies');

      const sectionMissingContent = await agentPost('/api/profile/custom-sections')
        .send({ title: 'Empty' })
        .expect(400);
      expect(sectionMissingContent.body.errors.content).toEqual(["'Content' must not be empty."]);
    });

    it('unauthenticated section access yields 401 {"message":"Not authenticated."}', async () => {
      const res = await request(server).get('/api/profile/skills').expect(401);
      expect(res.body).toEqual({ message: 'Not authenticated.' });
    });
  });

  describe('analytics', () => {
    let profileId: string;

    it('tracks a page view anonymously', async () => {
      const me = await agentGet('/api/profile/me').expect(200);
      profileId = me.body.id;

      const csrf = await request(server).get('/api/auth/csrf');
      const anonJar = new CookieJar();
      anonJar.absorb(csrf);

      const res = await request(server)
        .post('/api/analytics/track')
        .set('Cookie', anonJar.header())
        .set('X-CSRF-TOKEN', anonJar.get('procraft_csrf') ?? '')
        .set('User-Agent', 'e2e-agent')
        .send({ profileId, referer: 'https://procraft.uz/e2euser' })
        .expect(200);

      expect(res.body.eventType).toBe('PageView');
      expect(res.body.profileId).toBe(profileId);
    });

    it('404s for an unknown profile', async () => {
      const csrf = await request(server).get('/api/auth/csrf');
      const anonJar = new CookieJar();
      anonJar.absorb(csrf);

      const res = await request(server)
        .post('/api/analytics/track')
        .set('Cookie', anonJar.header())
        .set('X-CSRF-TOKEN', anonJar.get('procraft_csrf') ?? '')
        .send({ profileId: '11111111-2222-3333-4444-555555555555' })
        .expect(404);
      expect(res.body).toEqual({ message: 'Profile not found.' });
    });

    it('summary aggregates views for the owner', async () => {
      const res = await agentGet('/api/analytics/summary').expect(200);
      expect(res.body.totalViews).toBeGreaterThanOrEqual(1);
      expect(res.body.topCountries[0]).toEqual({ country: 'UZ', count: expect.any(Number) });
      expect(res.body.recentVisitors[0].city).toBe('Tashkent');
      expect(res.body.viewsByDate.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('templates & subscriptions', () => {
    it('lists active templates sorted by name', async () => {
      const res = await request(server).get('/api/templates').expect(200);
      expect(res.body.map((template: { slug: string }) => template.slug)).toEqual([
        'classic',
        'developer',
        'editorial',
        'minimal',
        'modern',
      ]);
      expect(res.body[0]).toHaveProperty('previewUrl');
      expect(res.body[0]).toHaveProperty('isPremium');
    });

    it('returns the trial subscription when none exists', async () => {
      const res = await agentGet('/api/subscriptions/me').expect(200);
      expect(res.body.id).toBe('00000000-0000-0000-0000-000000000000');
      expect(res.body.planKey).toBe('trial');
      expect(res.body.status).toBe('Trial');
    });
  });

  describe('pdf', () => {
    it('downloads the resume PDF', async () => {
      const res = await agentGet('/api/pdf/download').buffer(true).parse(binaryParser).expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('resume.pdf');
      const body = res.body as Buffer;
      expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
      expect(body.length).toBeGreaterThan(1000);
    });

    it('requires authentication', async () => {
      await request(server).get('/api/pdf/download').expect(401);
    });
  });

  describe('admin', () => {
    const adminJar = new CookieJar();

    it('rejects wrong credentials', async () => {
      const res = await request(server)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'nope' })
        .expect(401);
      expect(res.body).toEqual({ message: 'Invalid admin credentials' });
    });

    it('logs in with configured credentials (CSRF exempt)', async () => {
      const res = await request(server)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'admin-e2e-password' })
        .expect(200);
      adminJar.absorb(res);
      expect(res.body).toEqual({ authenticated: true });
      expect(adminJar.get('procraft_admin_session')).toMatch(/^[0-9A-F]{64}$/);
    });

    it('GET /api/admin/me confirms the session', async () => {
      const res = await request(server).get('/api/admin/me').set('Cookie', adminJar.header()).expect(200);
      expect(res.body).toEqual({ authenticated: true });
    });

    it('GET /api/admin/stats returns the aggregate shape', async () => {
      const res = await request(server).get('/api/admin/stats').set('Cookie', adminJar.header()).expect(200);
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.totalProfiles).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.templateUsage)).toBe(true);
      expect(Array.isArray(res.body.topProfiles)).toBe(true);
      expect(res.body.portfolioCreators[0]).toHaveProperty('skillsCount');
      expect(res.body.portfolioCreators[0]).toHaveProperty('views');
    });

    it('logout clears the session', async () => {
      const res = await request(server).post('/api/admin/logout').set('Cookie', adminJar.header()).expect(200);
      adminJar.absorb(res);
      await request(server).get('/api/admin/me').set('Cookie', adminJar.header()).expect(401);
    });
  });

  describe('account management', () => {
    it('PUT /api/auth/account updates and normalizes fields', async () => {
      const res = await agentPut('/api/auth/account')
        .send({ email: 'E2E.USER@procraft.uz', username: 'E2EUSER', phoneNumber: '  ' })
        .expect(400);
      // uppercase username fails the regex like C#
      expect(res.body.errors.username).toBeDefined();

      const ok = await agentPut('/api/auth/account')
        .send({ email: user.email, username: user.username, phoneNumber: '+998901112233' })
        .expect(200);
      expect(ok.body.user.phoneNumber).toBe('+998901112233');
    });

    it('conflicts with another user’s email', async () => {
      const res = await agentPut('/api/auth/account')
        .send({ email: 'tulaganovraximjon65@gmail.com', username: user.username })
        .expect(409);
      expect(res.body).toEqual({ message: 'Conflict', errors: { email: ['Email is already taken'] } });
    });

    it('DELETE /api/auth/account removes the user and cascades', async () => {
      const res = await agentDelete('/api/auth/account').expect(200);
      expect(res.body).toEqual({ message: 'Account deleted successfully' });
      jar.absorb(res);

      await request(server).get(`/api/profile/${user.username}`).expect(404);
    });
  });
});

function binaryParser(res: request.Response, callback: (err: Error | null, body: Buffer) => void): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}
