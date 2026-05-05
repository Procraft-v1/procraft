import { Typography } from 'antd';

export default function MinimalTemplate({ profile }) {
  return (
    <main className="public-template public-template--minimal">
      <article className="minimal-sheet">
        <header>
          <Typography.Title level={1}>{profile.fullName}</Typography.Title>
          {profile.title ? <Typography.Text className="template-title">{profile.title}</Typography.Text> : null}
        </header>

        {profile.bio ? <Typography.Paragraph className="template-bio">{profile.bio}</Typography.Paragraph> : null}

        <footer className="template-meta">
          {profile.location ? <span>{profile.location}</span> : null}
          {profile.website ? (
            <a href={profile.website} target="_blank" rel="noreferrer">
              {profile.website}
            </a>
          ) : null}
        </footer>
      </article>
    </main>
  );
}
