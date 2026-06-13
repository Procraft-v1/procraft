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

export function buildProfileMetadata(username: string, profile: PublicProfile | null): Metadata {
  if (!profile) {
    return {
      title: 'Procraft Profiles',
      robots: { index: false, follow: false },
    };
  }

  const displayName = profile.fullName || profile.username || username;
  const role = profile.title ? String(profile.title) : 'Portfolio';
  const title = `${displayName} — ${role} | Procraft`;
  const description = profile.bio
    ? truncate(String(profile.bio))
    : `${displayName} portfolio sahifasi — Procraft platformasida yaratilgan professional portfolio.`;
  const canonical = `https://${profile.username || username}.procraft.uz/`;
  const image = toAbsoluteAssetUrl(profile.avatarUrl) || FALLBACK_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'profile',
      url: canonical,
      siteName: 'Procraft',
      title,
      description,
      images: [{ url: image }],
      locale: 'uz_UZ',
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
