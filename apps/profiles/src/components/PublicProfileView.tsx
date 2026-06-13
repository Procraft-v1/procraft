import { notFound } from 'next/navigation';

import TemplateRenderer from '../templates/TemplateRenderer';
import ProfileAlert from './ProfileAlert';
import ProfileViewTracker from './ProfileViewTracker';
import { fetchPublicProfile } from '../lib/public-profile';

export default async function PublicProfileView({ username }: { username: string }) {
  if (!username) {
    return <ProfileAlert type="info" message="Profile username is missing." />;
  }

  const profile = await fetchPublicProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <>
      <TemplateRenderer profile={profile} />
      <ProfileViewTracker profileId={profile.id} />
    </>
  );
}
