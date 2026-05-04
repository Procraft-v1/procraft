import { Card, Space, Typography } from 'antd';

export default function ModernTemplate({ profile }) {
  return (
    <main style={{ minHeight: '100vh', padding: '56px 24px', background: '#F6F7F9' }}>
      <Card
        style={{
          maxWidth: 820,
          margin: '0 auto',
          borderColor: '#E5E7EB',
          boxShadow: '0 20px 60px rgba(13, 27, 42, 0.08)',
        }}
      >
        <div style={{ width: 64, height: 6, background: '#06B6D4', marginBottom: 24 }} />
        <Typography.Title level={1} style={{ color: '#0D1B2A', marginBottom: 4 }}>
          {profile.fullName}
        </Typography.Title>
        {profile.title ? (
          <Typography.Title level={4} style={{ color: '#2563EB', marginTop: 0 }}>
            {profile.title}
          </Typography.Title>
        ) : null}
        {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}
        <Space split={<span style={{ color: '#CBD5E1' }}>/</span>} wrap>
          {profile.location ? <Typography.Text>{profile.location}</Typography.Text> : null}
          {profile.website ? (
            <a href={profile.website} target="_blank" rel="noreferrer">
              {profile.website}
            </a>
          ) : null}
        </Space>
      </Card>
    </main>
  );
}
