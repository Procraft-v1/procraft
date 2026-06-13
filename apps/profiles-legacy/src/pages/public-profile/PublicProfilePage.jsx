import { useEffect, useRef } from 'react';
import { Alert, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { usePublicProfile, useTrackProfileView } from '@procraft/hooks';

import useUsername from '../../shared/hooks/useUsername.js';
import TemplateRenderer from '../../templates/TemplateRenderer.jsx';

export default function PublicProfilePage() {
  const params = useParams();
  const hostnameUsername = useUsername();
  const username = params.username || hostnameUsername;
  const { data: profile, isLoading, isError } = usePublicProfile(username);
  const trackedProfileId = useRef(null);
  const { mutate: trackProfileView } = useTrackProfileView();

  useEffect(() => {
    if (!profile?.id || trackedProfileId.current === profile.id) {
      return;
    }

    trackedProfileId.current = profile.id;
    trackProfileView({
      profileId: profile.id,
      referer: typeof document === 'undefined' ? null : document.referrer,
    });
  }, [profile?.id, trackProfileView]);

  if (!username) {
    return <Alert type="info" message="Profile username is missing." />;
  }

  if (isLoading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !profile) {
    return <Alert type="warning" message="Profile not found." />;
  }

  return <TemplateRenderer profile={profile} />;
}
