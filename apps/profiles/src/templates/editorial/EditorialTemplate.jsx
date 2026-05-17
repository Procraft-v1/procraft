import { Typography } from 'antd';
import { resolveAssetUrl } from '@procraft/config';
import './EditorialTemplate.css';

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
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function EditorialSection({ title, children }) {
  return (
    <section className="editorial-section">
      <Typography.Title level={2}>{title}</Typography.Title>
      {children}
    </section>
  );
}

export default function EditorialTemplate({ profile }) {
  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];
  const hasSidebar =
    Boolean(profile.location) ||
    hasItems(socialLinks) ||
    hasItems(skills) ||
    hasItems(educations);
  const hasMain =
    hasItems(experiences) ||
    hasItems(projects) ||
    hasItems(certificates);

  return (
    <main className="public-template public-template--editorial">
      <header className="editorial-hero">
        <div className="editorial-hero__topline">
          <span>Portfolio</span>
          {profile.location ? <span>{profile.location}</span> : null}
        </div>
        <div className="editorial-hero__content">
          <div>
            {profile.title ? <span className="editorial-kicker">{profile.title}</span> : null}
            <Typography.Title level={1}>{profile.fullName}</Typography.Title>
          </div>
          <div className="editorial-avatar">
            {profile.avatarUrl ? (
              <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || 'Profile avatar'} />
            ) : (
              <span>{initials(profile)}</span>
            )}
          </div>
        </div>
        {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}
      </header>

      <div className={`editorial-layout${hasSidebar ? '' : ' editorial-layout--single'}`}>
        {hasSidebar ? (
          <aside className="editorial-sidebar">
            <div className="editorial-note">
              <strong>Profile</strong>
              <span>{profile.title || profile.fullName || profile.username || 'Portfolio'}</span>
            </div>

            {hasItems(socialLinks) ? (
              <EditorialSection title="Aloqa">
                <div className="editorial-link-list">
                  {socialLinks.map((link) => (
                    <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
                      {link.platform}
                    </ExternalLink>
                  ))}
                </div>
              </EditorialSection>
            ) : null}

            {hasItems(skills) ? (
              <EditorialSection title="Ko'nikmalar">
                <div className="editorial-skills">
                  {skills.map((skill) => (
                    <span key={skill.id || skill.name}>
                      {skill.name}
                      {skill.level ? <small>{skill.level}/5</small> : null}
                    </span>
                  ))}
                </div>
              </EditorialSection>
            ) : null}

            {hasItems(educations) ? (
              <EditorialSection title="Ta'lim">
                <div className="editorial-stack">
                  {educations.map((item) => (
                    <article key={item.id || item.institution}>
                      <strong>{item.institution}</strong>
                      {[item.degree, item.field].filter(Boolean).length ? (
                        <p>{[item.degree, item.field].filter(Boolean).join(' - ')}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </EditorialSection>
            ) : null}
          </aside>
        ) : null}

        <div className="editorial-main">
          {hasItems(experiences) ? (
            <EditorialSection title="Tajriba">
              <div className="editorial-timeline">
                {experiences.map((item) => (
                  <article key={item.id || `${item.company}-${item.position}`}>
                    <span>{dateRange(item.startDate, item.endDate, item.isCurrent)}</span>
                    <Typography.Title level={3}>{item.position}</Typography.Title>
                    <strong>{item.company}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </EditorialSection>
          ) : null}

          {hasItems(projects) ? (
            <EditorialSection title="Tanlangan loyihalar">
              <div className="editorial-projects">
                {projects.map((project) => (
                  <article key={project.id || project.name}>
                    <Typography.Title level={3}>{project.name}</Typography.Title>
                    {project.description ? <p>{project.description}</p> : null}
                    <div>
                      {project.isRepositoryPrivate ? <span>Yopiq repository</span> : null}
                      {!project.isRepositoryPrivate && project.githubUrl ? (
                        <ExternalLink href={project.githubUrl}>GitHub</ExternalLink>
                      ) : null}
                      {project.liveUrl ? <ExternalLink href={project.liveUrl}>Live link</ExternalLink> : null}
                    </div>
                  </article>
                ))}
              </div>
            </EditorialSection>
          ) : null}

          {hasItems(certificates) ? (
            <EditorialSection title="Sertifikatlar">
              <div className="editorial-stack">
                {certificates.map((item) => (
                  <article key={item.id || item.name}>
                    <strong>{item.name}</strong>
                    {item.issuer ? <p>{item.issuer}</p> : null}
                    {item.issuedOn ? <p>{item.issuedOn}</p> : null}
                    {item.url ? <ExternalLink href={resolveAssetUrl(item.url)}>Sertifikatni ko'rish</ExternalLink> : null}
                  </article>
                ))}
              </div>
            </EditorialSection>
          ) : null}

          {!hasMain ? (
            <section className="editorial-empty">
              <Typography.Title level={2}>Portfolio hali to'ldirilmoqda</Typography.Title>
              <Typography.Paragraph>
                Ko'nikmalar, tajriba va loyihalar qo'shilganda bu sahifa jurnal uslubidagi portfolio sifatida ochiladi.
              </Typography.Paragraph>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
