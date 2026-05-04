import { Typography } from 'antd';

export default function MinimalTemplate({ profile }) {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '64px 24px',
        background: '#FFFFFF',
        color: '#0D1B2A',
      }}
    >
      <Typography.Title level={1} style={{ marginBottom: 4 }}>
        {profile.fullName}
      </Typography.Title>
      {profile.title ? (
        <Typography.Title level={4} style={{ fontWeight: 400, marginTop: 0 }}>
          {profile.title}
        </Typography.Title>
      ) : null}
      {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}
      <ProfileMeta profile={profile} />
    </main>
  );
}

function ProfileMeta({ profile }) {
  return (
    <Typography.Paragraph type="secondary">
      {[profile.location, profile.website].filter(Boolean).join(' | ')}
    </Typography.Paragraph>
  );
}
