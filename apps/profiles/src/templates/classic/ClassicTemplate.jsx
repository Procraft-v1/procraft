import { Typography } from 'antd';
import { resolveAssetUrl } from '@procraft/config';
import './ClassicTemplate.css';

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function ExternalLink({ href, children }) {
  if (!href) {
    return null;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function dateRange(startDate, endDate, isCurrent) {
  return [startDate, isCurrent ? 'Hozir' : endDate].filter(Boolean).join(' - ');
}

function initials(profile) {
  return (profile.fullName || profile.username || 'P')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function ClassicSection({ title, children }) {
  return (
    <section className="classic-section">
      <Typography.Title level={2}>{title}</Typography.Title>
      {children}
    </section>
  );
}

export default function ClassicTemplate({ profile }) {
  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];

  return (
    <main className="public-template public-template--classic">
      <header className="classic-header">
        <div className="classic-header__identity">
          <div className="classic-avatar">
            {profile.avatarUrl ? (
              <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || 'Profile avatar'} />
            ) : (
              <span>{initials(profile)}</span>
            )}
          </div>
          <div>
            <Typography.Title level={1}>{profile.fullName}</Typography.Title>
            {profile.title ? <Typography.Text>{profile.title}</Typography.Text> : null}
          </div>
        </div>
        <nav>
          {profile.location ? <span>{profile.location}</span> : null}
          {socialLinks.map((link) => (
            <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
              {link.platform}
            </ExternalLink>
          ))}
        </nav>
      </header>

      {profile.bio ? (
        <section className="classic-intro">
          <Typography.Paragraph>{profile.bio}</Typography.Paragraph>
        </section>
      ) : null}

      <div className="classic-layout">
        <div className="classic-main">
          {hasItems(experiences) ? (
            <ClassicSection title="Tajriba">
              <div className="classic-list">
                {experiences.map((item) => (
                  <article className="classic-entry" key={item.id || `${item.company}-${item.position}`}>
                    <div className="classic-entry__heading">
                      <Typography.Title level={3}>{item.position}</Typography.Title>
                      <span>{dateRange(item.startDate, item.endDate, item.isCurrent)}</span>
                    </div>
                    <strong>{item.company}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(projects) ? (
            <ClassicSection title="Tanlangan loyihalar">
              <div className="classic-list">
                {projects.map((project) => (
                  <article className="classic-entry" key={project.id || project.name}>
                    <Typography.Title level={3}>{project.name}</Typography.Title>
                    {project.description ? <p>{project.description}</p> : null}
                    <div className="classic-links">
                      {project.isRepositoryPrivate ? <span>Yopiq repository</span> : null}
                      {!project.isRepositoryPrivate && project.githubUrl ? (
                        <ExternalLink href={project.githubUrl}>GitHub</ExternalLink>
                      ) : null}
                      {project.liveUrl ? <ExternalLink href={project.liveUrl}>Live link</ExternalLink> : null}
                    </div>
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}
        </div>

        <aside className="classic-side">
          {hasItems(skills) ? (
            <ClassicSection title="Ko'nikmalar">
              <div className="classic-skills">
                {skills.map((skill) => (
                  <span key={skill.id || skill.name}>{skill.name}</span>
                ))}
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(educations) ? (
            <ClassicSection title="Ta'lim">
              <div className="classic-stack">
                {educations.map((item) => (
                  <article key={item.id || item.institution}>
                    <strong>{item.institution}</strong>
                    {[item.degree, item.field].filter(Boolean).length ? (
                      <p>{[item.degree, item.field].filter(Boolean).join(' - ')}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(certificates) ? (
            <ClassicSection title="Sertifikatlar">
              <div className="classic-stack">
                {certificates.map((item) => (
                  <article key={item.id || item.name}>
                    <strong>{item.name}</strong>
                    {item.issuer ? <p>{item.issuer}</p> : null}
                    {item.issuedOn ? <p>{item.issuedOn}</p> : null}
                    {item.url ? <ExternalLink href={resolveAssetUrl(item.url)}>Sertifikatni ko'rish</ExternalLink> : null}
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
