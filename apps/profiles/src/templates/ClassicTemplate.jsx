import { Divider, Typography } from 'antd';

export default function ClassicTemplate({ profile }) {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '72px 24px',
        textAlign: 'center',
        color: '#0D1B2A',
      }}
    >
      <Typography.Title level={1} style={{ fontFamily: 'Georgia, serif', marginBottom: 8 }}>
        {profile.fullName}
      </Typography.Title>
      {profile.title ? (
        <Typography.Title level={4} style={{ fontWeight: 400, marginTop: 0 }}>
          {profile.title}
        </Typography.Title>
      ) : null}
      <Divider />
      {profile.bio ? (
        <Typography.Paragraph style={{ maxWidth: 620, margin: '0 auto 24px' }}>
          {profile.bio}
        </Typography.Paragraph>
      ) : null}
      <Typography.Text type="secondary">
        {[profile.location, profile.website].filter(Boolean).join(' - ')}
      </Typography.Text>
    </main>
  );
}
