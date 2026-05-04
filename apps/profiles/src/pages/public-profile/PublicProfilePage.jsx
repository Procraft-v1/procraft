import { Alert, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { usePublicProfile } from '@procraft/hooks';

import useUsername from '../../shared/hooks/useUsername.js';
import TemplateRenderer from '../../templates/TemplateRenderer.jsx';

export default function PublicProfilePage() {
  const params = useParams();
  const hostnameUsername = useUsername();
  const username = params.username || hostnameUsername;
  const { data: profile, isLoading, isError } = usePublicProfile(username);

  if (!username) {
    return <Alert type="info" message="Profile username is missing." />;
  }

  if (isLoading) {
    return <Spin />;
  }

  if (isError || !profile) {
    return <Alert type="warning" message="Profile not found." />;
  }

  return <TemplateRenderer profile={profile} />;
}
