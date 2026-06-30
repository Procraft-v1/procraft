import { NextFunction, Request, Response } from 'express';
import { getClientIp } from './request-context';

/**
 * Lightweight in-memory fixed-window rate limiter for abuse-prone endpoints
 * (credential brute-force, SMS/email flooding, analytics spam). Intentionally
 * dependency-free and single-instance — Procraft runs one API container, so a
 * process-local store is sufficient and never adds a Redis hop.
 *
 * Loopback callers (127.0.0.1/::1) are always exempt so local dev and the e2e
 * suite — which hit the app over the loopback socket — are never throttled.
 * Behind nginx the real client IP arrives via X-Forwarded-For (trust proxy is
 * enabled), so production traffic is limited by genuine source address.
 */

interface RateRule {
  /** Lowercased path prefix the rule applies to (segment-boundary match). */
  prefix: string;
  /** HTTP methods the rule applies to. */
  methods: string[];
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

const MINUTE = 60_000;

/**
 * Limits are deliberately generous so ordinary users (including several behind
 * one carrier-grade NAT address) are never blocked, while scripted floods are
 * stopped. Tighten via these constants if abuse is observed.
 */
const RULES: RateRule[] = [
  // Credential endpoints: stop password brute-force / code guessing.
  { prefix: '/api/auth/login', methods: ['POST'], limit: 30, windowMs: 5 * MINUTE },
  { prefix: '/api/auth/register', methods: ['POST'], limit: 20, windowMs: 10 * MINUTE },
  // Code-sending endpoints: SMS/email cost real money, so keep these tighter.
  { prefix: '/api/auth/password/forgot', methods: ['POST'], limit: 12, windowMs: 10 * MINUTE },
  { prefix: '/api/auth/password/reset', methods: ['POST'], limit: 20, windowMs: 10 * MINUTE },
  // Public, unauthenticated view tracking: cap insert spam.
  { prefix: '/api/analytics/track', methods: ['POST'], limit: 120, windowMs: MINUTE },
  // Public GitHub import preview: stop using us as a GitHub scraping proxy.
  { prefix: '/api/github/preview', methods: ['GET'], limit: 60, windowMs: MINUTE },
];

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();
let lastSweep = 0;

/** Drops expired counters so the map cannot grow unbounded under attack. */
function sweep(now: number): void {
  if (now - lastSweep < MINUTE) {
    return;
  }
  lastSweep = now;
  for (const [key, counter] of buckets) {
    if (counter.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function isLoopback(ip: string | null): boolean {
  if (!ip) {
    return false;
  }
  const normalized = ip.replace(/^::ffff:/i, '');
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
}

/** PathString.StartsWithSegments semantics: exact match or boundary at '/'. */
function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function findRule(method: string, path: string): RateRule | null {
  for (const rule of RULES) {
    if (rule.methods.includes(method) && matchesPrefix(path, rule.prefix)) {
      return rule;
    }
  }
  return null;
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  const rule = findRule(method, req.path.toLowerCase());
  if (!rule) {
    next();
    return;
  }

  const ip = getClientIp(req);
  if (isLoopback(ip)) {
    next();
    return;
  }

  const now = Date.now();
  sweep(now);

  const key = `${rule.prefix}|${ip ?? 'unknown'}`;
  const counter = buckets.get(key);

  if (!counter || counter.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    next();
    return;
  }

  if (counter.count >= rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
    return;
  }

  counter.count += 1;
  next();
}

/** Test hook: clears all counters between cases. */
export function resetRateLimitState(): void {
  buckets.clear();
  lastSweep = 0;
}
