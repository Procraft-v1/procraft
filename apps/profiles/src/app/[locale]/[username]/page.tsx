import type { Metadata } from 'next';

import PublicProfileView from '../../../components/PublicProfileView';
import { buildProfileMetadata, fetchPublicProfile } from '../../../lib/public-profile';

export const dynamic = 'force-dynamic';

type Params = { locale: string; username: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  const profile = await fetchPublicProfile(username);
  return buildProfileMetadata(params.locale, username, profile);
}

export default function Page({ params }: { params: Params }) {
  const username = decodeURIComponent(params.username);
  return <PublicProfileView username={username} locale={params.locale} />;
}
