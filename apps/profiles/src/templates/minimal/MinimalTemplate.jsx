import { Typography } from 'antd';
import { resolveAssetUrl } from '@procraft/config';
import './MinimalTemplate.css';

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function initials(profile) {
  return (profile.fullName || profile.username || 'P')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function dateRange(startDate, endDate, isCurrent) {
  return [startDate, isCurrent ? 'Hozir' : endDate].filter(Boolean).join(' - ');
}

function ExternalLink({ href, children }) {
  if (!href) {
    return null;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="site-section">
      <Typography.Title level={2}>{title}</Typography.Title>
      {children}
    </section>
  );
}

export default function MinimalTemplate({ profile }) {
  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];

  return (
    <main className="portfolio-site portfolio-site--minimal">
      <header className="site-nav">
        <a className="site-nav__brand" href="#top">
          {profile.fullName || profile.username || 'Portfolio'}
        </a>
        <nav>
          {hasItems(projects) ? <a href="#projects">Loyihalar</a> : null}
          {hasItems(experiences) ? <a href="#experience">Tajriba</a> : null}
          {hasItems(skills) ? <a href="#skills">Ko'nikmalar</a> : null}
          {hasItems(certificates) ? <a href="#certificates">Sertifikatlar</a> : null}
          {hasItems(socialLinks) ? <a href="#contact">Aloqa</a> : null}
        </nav>
      </header>

      <section id="top" className="site-hero">
        <div className="site-hero__content">
          {profile.title ? <span className="site-kicker">{profile.title}</span> : null}
          <Typography.Title level={1}>{profile.fullName}</Typography.Title>
          {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}

          <div className="site-hero__actions">
            {hasItems(projects) ? <a href="#projects">Loyihalarni ko'rish</a> : null}
            {hasItems(socialLinks) ? <a href="#contact">Bog'lanish</a> : null}
          </div>
        </div>

        <aside className="site-hero__card">
          <div className="site-avatar">
            {profile.avatarUrl ? (
              <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || 'Profile avatar'} />
            ) : (
              <span>{initials(profile)}</span>
            )}
          </div>
          <strong>{profile.fullName}</strong>
          {profile.location ? <span>{profile.location}</span> : null}
        </aside>
      </section>

      {hasItems(skills) ? (
        <Section id="skills" title="Ko'nikmalar">
          <div className="site-skills">
            {skills.map((skill) => (
              <span key={skill.id || skill.name}>
                {skill.name}
                {skill.level ? <small>{skill.level}/5</small> : null}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {hasItems(projects) ? (
        <Section id="projects" title="Loyihalar">
          <div className="site-card-grid">
            {projects.map((project) => (
              <article className="site-card" key={project.id || project.name}>
                <Typography.Title level={3}>{project.name}</Typography.Title>
                {project.description ? <p>{project.description}</p> : null}
                <div className="site-card__links">
                  {project.isRepositoryPrivate ? <span>Yopiq repository</span> : null}
                  {!project.isRepositoryPrivate && project.githubUrl ? (
                    <ExternalLink href={project.githubUrl}>GitHub</ExternalLink>
                  ) : null}
                  {project.liveUrl ? <ExternalLink href={project.liveUrl}>Live link</ExternalLink> : null}
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      {hasItems(experiences) ? (
        <Section id="experience" title="Tajriba">
          <div className="site-list">
            {experiences.map((item) => (
              <article className="site-row" key={item.id || `${item.company}-${item.position}`}>
                <div>
                  <Typography.Title level={3}>{item.position}</Typography.Title>
                  <strong>{item.company}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                <span>{dateRange(item.startDate, item.endDate, item.isCurrent)}</span>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="site-two-column">
        {hasItems(educations) ? (
          <Section id="education" title="Ta'lim">
            <div className="site-stack">
              {educations.map((item) => (
                <article key={item.id || item.institution}>
                  <strong>{item.institution}</strong>
                  {[item.degree, item.field].filter(Boolean).length ? (
                    <p>{[item.degree, item.field].filter(Boolean).join(' - ')}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </Section>
        ) : null}

        {hasItems(certificates) ? (
          <Section id="certificates" title="Sertifikatlar">
            <div className="site-stack">
              {certificates.map((item) => (
                <article key={item.id || item.name}>
                  <strong>{item.name}</strong>
                  {item.issuer ? <p>{item.issuer}</p> : null}
                  {item.issuedOn ? <p>{item.issuedOn}</p> : null}
                  {item.url ? <ExternalLink href={resolveAssetUrl(item.url)}>Sertifikatni ko'rish</ExternalLink> : null}
                </article>
              ))}
            </div>
          </Section>
        ) : null}
      </div>

      {hasItems(socialLinks) ? (
        <footer id="contact" className="site-footer">
          <Typography.Title level={2}>Bog'lanish</Typography.Title>
          <div>
            {socialLinks.map((link) => (
              <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
                {link.platform}
              </ExternalLink>
            ))}
          </div>
        </footer>
      ) : null}
    </main>
  );
}
