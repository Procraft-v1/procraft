import * as fs from 'fs';
import * as path from 'path';

/**
 * Mirrors the ASP.NET Program.LoadEnvironmentFile behavior: walk up from cwd
 * until a .env file is found; set variables only when not already present.
 */
export function loadEnvironmentFile(): void {
  let directory: string | null = process.cwd();

  while (directory) {
    const envPath = path.join(directory, '.env');
    if (fs.existsSync(envPath)) {
      for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line.length === 0 || line.startsWith('#')) {
          continue;
        }

        const separator = line.indexOf('=');
        if (separator <= 0) {
          continue;
        }

        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^"|"$/g, '');

        if (!process.env[key] || process.env[key]!.trim() === '') {
          process.env[key] = value;
        }
      }

      return;
    }

    const parent = path.dirname(directory);
    directory = parent === directory ? null : parent;
  }
}

function env(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? undefined : value;
}

function envInt(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) {
    return fallback;
  }
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = env(name);
  if (!raw) {
    return fallback;
  }
  if (/^true$/i.test(raw)) return true;
  if (/^false$/i.test(raw)) return false;
  return fallback;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Accepts both ADO.NET style ("Host=x;Port=5432;Database=y;Username=u;Password=p")
 * and URI style ("postgres://u:p@host:5432/db") connection strings, matching the
 * values docker-compose passes via DATABASE_URL / ConnectionStrings__DefaultConnection.
 */
export function parseConnectionString(raw: string): DatabaseConfig {
  const trimmed = raw.trim();

  if (/^postgres(ql)?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      database: url.pathname.replace(/^\//, '') || 'postgres',
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }

  const parts = new Map<string, string>();
  for (const segment of trimmed.split(';')) {
    const idx = segment.indexOf('=');
    if (idx <= 0) {
      continue;
    }
    parts.set(segment.slice(0, idx).trim().toLowerCase(), segment.slice(idx + 1).trim());
  }

  const host = parts.get('host') ?? parts.get('server') ?? 'localhost';
  return {
    host,
    port: parseInt(parts.get('port') ?? '5432', 10),
    database: parts.get('database') ?? 'postgres',
    username: parts.get('username') ?? parts.get('user id') ?? parts.get('userid') ?? 'postgres',
    password: parts.get('password') ?? '',
  };
}

export type SameSiteValue = 'lax' | 'strict' | 'none' | undefined;

/** Mirrors Enum.TryParse<SameSiteMode>(value, ignoreCase: true) with Lax fallback. */
export function parseSameSite(value: string): SameSiteValue {
  switch (value.trim().toLowerCase()) {
    case 'none':
      return 'none';
    case 'strict':
      return 'strict';
    case 'lax':
      return 'lax';
    case 'unspecified':
      return undefined;
    default:
      return 'lax';
  }
}

export class AppConfig {
  /** ASPNETCORE_ENVIRONMENT drives environment semantics for parity with the .NET host. */
  readonly environment = env('ASPNETCORE_ENVIRONMENT') ?? (process.env.NODE_ENV === 'production' ? 'Production' : 'Development');

  get isProduction(): boolean {
    return this.environment.toLowerCase() === 'production';
  }

  get isDevelopment(): boolean {
    return this.environment.toLowerCase() === 'development';
  }

  readonly port = envInt('PORT', 8080);

  readonly jwt = {
    secret: env('JWT_SECRET') ?? env('Jwt__Secret') ?? '',
    issuer: env('JWT_ISSUER') ?? env('Jwt__Issuer') ?? '',
    audience: env('JWT_AUDIENCE') ?? env('Jwt__Audience') ?? '',
    accessTokenMinutes: envInt('JWT_ACCESS_MINUTES', 15),
    refreshTokenDays: envInt('JWT_REFRESH_DAYS', 7),
  };

  /**
   * Defaults mirror appsettings.json (production posture) and
   * appsettings.Development.json (relaxed local posture); env vars override both.
   */
  readonly cookies = this.isDevelopment
    ? {
        accessCookieName: env('JWT_ACCESS_COOKIE_NAME') ?? 'procraft_access',
        refreshCookieName: env('JWT_REFRESH_COOKIE_NAME') ?? 'procraft_refresh',
        csrfCookieName: env('CSRF_COOKIE_NAME') ?? 'procraft_csrf',
        csrfCookieDomain: env('CSRF_COOKIE_DOMAIN') ?? '',
        sameSite: env('JWT_COOKIE_SAMESITE') ?? 'Lax',
        secure: envBool('JWT_COOKIE_SECURE', false),
      }
    : {
        accessCookieName: env('JWT_ACCESS_COOKIE_NAME') ?? '__Host-procraft_access',
        refreshCookieName: env('JWT_REFRESH_COOKIE_NAME') ?? '__Host-procraft_refresh',
        csrfCookieName: env('CSRF_COOKIE_NAME') ?? 'procraft_csrf',
        csrfCookieDomain: env('CSRF_COOKIE_DOMAIN') ?? '.procraft.uz',
        sameSite: env('JWT_COOKIE_SAMESITE') ?? 'None',
        secure: envBool('JWT_COOKIE_SECURE', true),
      };

  readonly uploads = {
    rootPath: env('UPLOADS_ROOT') ?? 'uploads',
    publicBasePath: '/uploads',
    maxAvatarSizeMb: 5,
    maxCertificateSizeMb: 10,
  };

  readonly smtp = {
    host: env('Smtp__Host') ?? '',
    port: envInt('Smtp__Port', 587),
    username: env('Smtp__Username') ?? '',
    password: env('Smtp__Password') ?? '',
    fromAddress: env('Smtp__FromAddress') ?? 'noreply@procraft.uz',
    fromName: env('Smtp__FromName') ?? 'Procraft',
    enableSsl: envBool('Smtp__EnableSsl', true),
  };

  readonly eskiz = {
    email: env('Eskiz__Email') ?? '',
    password: env('Eskiz__Password') ?? '',
    sender: env('Eskiz__Sender') ?? '4546',
  };

  readonly telegram = {
    botToken: env('Telegram__BotToken') ?? '',
    botUsername: env('Telegram__BotUsername') ?? '',
    webhookUrl: env('Telegram__WebhookUrl') ?? '',
  };

  readonly admin = {
    username: env('Admin__Username') ?? env('ADMIN_USERNAME') ?? '',
    password: env('Admin__Password') ?? env('ADMIN_PASSWORD') ?? '',
    sessionSecret:
      env('Admin__SessionSecret') ??
      env('ADMIN_SESSION_SECRET') ??
      env('JWT_SECRET') ??
      env('Admin__Password') ??
      env('ADMIN_PASSWORD') ??
      '',
  };

  readonly corsAllowedOrigins = (env('CORS_ALLOWED_ORIGINS') ?? env('Cors__AllowedOrigins') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  readonly corsDevelopmentOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
  ];

  get connectionString(): string {
    const value = env('ConnectionStrings__DefaultConnection') ?? env('DATABASE_URL');
    if (!value) {
      throw new Error(
        'Database connection string is missing. Set ConnectionStrings:DefaultConnection or DATABASE_URL.',
      );
    }
    return value;
  }

  get database(): DatabaseConfig {
    return parseConnectionString(this.connectionString);
  }

  validate(): void {
    if (!this.jwt.secret || this.jwt.secret.length < 32) {
      throw new Error('Jwt:Secret must be configured and at least 32 characters before JWT authentication starts.');
    }
    if (!this.jwt.issuer) {
      throw new Error('Jwt:Issuer is required. Set Jwt:Issuer or JWT_ISSUER.');
    }
    if (!this.jwt.audience) {
      throw new Error('Jwt:Audience is required. Set Jwt:Audience or JWT_AUDIENCE.');
    }
    if (this.isProduction && !this.cookies.secure) {
      throw new Error('Cookies:Secure must be true in Production.');
    }
  }
}

let cachedConfig: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = new AppConfig();
  }
  return cachedConfig;
}

/** Test hook: reset cached config after mutating process.env. */
export function resetConfigCache(): void {
  cachedConfig = undefined;
}
