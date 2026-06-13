import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { getSubdomain } from '@procraft/utils';

import PublicProfileView from '../components/PublicProfileView';
import { buildProfileMetadata, fetchPublicProfile } from '../lib/public-profile';

export const dynamic = 'force-dynamic';

type SearchParams = { [key: string]: string | string[] | undefined };

/**
 * Production resolves the username from the wildcard subdomain
 * ({username}.procraft.uz); local dev falls back to `?username=demo` —
 * identical to the legacy SPA's useUsername() hook.
 */
function resolveUsername(searchParams: SearchParams): string {
  const param = Array.isArray(searchParams.username)
    ? searchParams.username[0]
    : searchParams.username;

  if (param) {
    return param;
  }

  const host = headers().get('host') ?? '';
  return getSubdomain(host);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const username = resolveUsername(searchParams);
  const profile = await fetchPublicProfile(username);
  return buildProfileMetadata(username, profile);
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const username = resolveUsername(searchParams);
  return <PublicProfileView username={username} />;
}
