import { cache } from 'react';
import type { Metadata } from 'next';

import { getServerApiBaseUrl, resolveAssetUrl } from '@procraft/config';

export interface PublicProfile {
  id: string;
  username?: string;
  fullName?: string;
  title?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  templateSlug?: string;
  [key: string]: unknown;
}

/**
 * Server-side fetch of the public profile. `cache()` dedupes the request
 * between generateMetadata and the page render within one request.
 * Any failure resolves to null — the legacy SPA rendered "Profile not
 * found." for every error shape, and we keep that contract.
 */
export const fetchPublicProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  if (!username) {
    return null;
  }

  const base = getServerApiBaseUrl().replace(/\/$/, '');

  try {
    const response = await fetch(`${base}/profile/${encodeURIComponent(username)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicProfile;
  } catch (error) {
    console.error(`Public profile fetch failed for "${username}"`, error);
    return null;
  }
});

const FALLBACK_OG_IMAGE = 'https://procraft.uz/brand/procraft-logo-mark-transparent.png';

const OG_LOCALE: Record<string, string> = {
  uz: 'uz_UZ',
  en: 'en_US',
  ru: 'ru_RU',
};

function defaultDescription(locale: string, displayName: string): string {
  if (locale === 'en') {
    return `${displayName}'s portfolio — A professional portfolio built on the Procraft platform.`;
  }
  if (locale === 'ru') {
    return `Портфолио ${displayName} — Профессиональное портфолио, созданное на платформе Procraft.`;
  }
  return `${displayName} portfolio sahifasi — Procraft platformasida yaratilgan professional portfolio.`;
}

function truncate(value: string, max = 160): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function toAbsoluteAssetUrl(value?: string): string | null {
  if (!value) {
    return null;
  }

  const resolved = resolveAssetUrl(value);
  if (!resolved || !/^https?:\/\//i.test(resolved)) {
    return null;
  }

  return resolved;
}

export function buildProfileMetadata(
  locale: string,
  username: string,
  profile: PublicProfile | null,
): Metadata {
  if (!profile) {
    return {
      title: 'Procraft Profiles',
      robots: { index: false, follow: false },
    };
  }

  const slug = profile.username || username;
  const displayName = profile.fullName || profile.username || username;
  const role = profile.title ? String(profile.title) : 'Portfolio';
  const title = `${displayName} — ${role} | Procraft`;
  const description = profile.bio
    ? truncate(String(profile.bio))
    : defaultDescription(locale, displayName);
  const image = toAbsoluteAssetUrl(profile.avatarUrl) || FALLBACK_OG_IMAGE;

  // Canonical is always the default (uz) subdomain root
  const base = `https://${slug}.procraft.uz`;
  const canonical = locale === 'uz' ? `${base}/` : `${base}/${locale}/`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'x-default': `${base}/`,
        uz: `${base}/`,
        en: `${base}/en/`,
        ru: `${base}/ru/`,
      },
    },
    openGraph: {
      type: 'profile',
      url: canonical,
      siteName: 'Procraft',
      title,
      description,
      images: [{ url: image }],
      locale: OG_LOCALE[locale] ?? 'uz_UZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
