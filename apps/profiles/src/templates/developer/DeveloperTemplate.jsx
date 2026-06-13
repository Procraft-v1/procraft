'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PROCRAFT_CONTACT_LINKS, resolveAssetUrl } from '@procraft/config';
import './DeveloperTemplate.css';

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

function dateRange(startDate, endDate, isCurrent, present) {
  return [startDate, isCurrent ? present : endDate].filter(Boolean).join(' - ');
}

function ExternalLink({ href, children, className }) {
  if (!href) {
    return null;
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="dev-section">
      <div className="dev-section__head">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CodeEditorPreview({ profile, projects, skills }) {
  const displayName = profile.fullName || profile.username || 'Developer';
  const role = profile.title || 'Software Developer';

  return (
    <aside className="dev-editor" aria-label="Developer profile preview">
      <div className="dev-editor__bar">
        <span />
        <span />
        <span />
        <strong>portfolio.config.ts</strong>
      </div>
      <pre>
        <code>
          <span className="dev-code__muted">const</span> profile = {'{'}
          {'\n'}  name: <span className="dev-code__green">"{displayName}"</span>,
          {'\n'}  role: <span className="dev-code__green">"{role}"</span>,
          {'\n'}  projects: <span className="dev-code__blue">{projects.length}</span>,
          {'\n'}  technologies: <span className="dev-code__blue">{skills.length}</span>,
          {'\n'}  available: <span className="dev-code__green">true</span>
          {'\n'}
          {'};'}
        </code>
      </pre>
    </aside>
  );
}

function TechStack({ skills, t }) {
  if (!hasItems(skills)) {
    return null;
  }

  const grouped = skills.reduce((groups, skill) => {
    const category = skill.category?.trim() || 'Core stack';
    return {
      ...groups,
      [category]: [...(groups[category] || []), skill],
    };
  }, {});

  return (
    <Section id="stack" eyebrow="Stack" title={t('technologies')}>
      <div className="dev-stack-grid">
        {Object.entries(grouped).map(([category, items]) => (
          <article className="dev-stack-card" key={category}>
            <div className="dev-terminal-line">
              <span>$</span> stack --category <strong>{category.toLowerCase()}</strong>
            </div>
            <div className="dev-skill-list">
              {items.map((skill) => (
                <span key={skill.id || skill.name}>
                  {skill.name}
                  {skill.level ? <small>{skill.level}/5</small> : null}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Projects({ projects, t }) {
  if (!hasItems(projects)) {
    return null;
  }

  return (
    <Section id="projects" eyebrow="Projects" title="Featured projects">
      <div className="dev-project-grid">
        {projects.map((project, index) => (
          <article className="dev-project-card" key={project.id || project.name}>
            <div className="dev-project-card__top">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span>{project.isRepositoryPrivate ? 'private repo' : 'public repo'}</span>
            </div>
            <h3>{project.name}</h3>
            {project.description ? <p>{project.description}</p> : null}
            <div className="dev-project-card__links">
              {!project.isRepositoryPrivate && project.githubUrl ? (
                <ExternalLink href={project.githubUrl}>GitHub</ExternalLink>
              ) : null}
              {project.isRepositoryPrivate ? <span>{t('privateRepo')}</span> : null}
              {project.liveUrl ? <ExternalLink href={project.liveUrl}>Live</ExternalLink> : null}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Stats({ projects, skills, experiences }) {
  const stats = [
    ['Projects', projects.length],
    ['Experience', experiences.length],
    ['Technologies', skills.length],
  ].filter(([, value]) => value > 0);

  if (!stats.length) {
    return null;
  }

  return (
    <section className="dev-stats" aria-label="Developer stats">
      {stats.map(([label, value]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

function Timeline({ experiences, educations, t, te }) {
  const items = [
    ...experiences.map((item) => ({
      id: item.id || `${item.company}-${item.position}`,
      title: item.position,
      meta: item.company,
      detail: item.description,
      date: dateRange(item.startDate, item.endDate, item.isCurrent, t('now')),
      kind: item.experienceType || 'work',
    })),
    ...educations.map((item) => ({
      id: item.id || item.institution,
      title: item.institution,
      meta: [item.degree, item.field].filter(Boolean).join(' - '),
      detail: null,
      date: te(item.educationType ?? 'formal'),
      kind: item.educationType || 'learning',
    })),
  ];

  if (!items.length) {
    return null;
  }

  return (
    <Section id="experience" eyebrow="Timeline" title="Experience / learning path">
      <div className="dev-timeline">
        {items.map((item) => (
          <article className="dev-timeline__item" key={item.id}>
            <div className="dev-timeline__marker" />
            <div>
              <div className="dev-timeline__top">
                <h3>{item.title}</h3>
                {item.date ? <span>{item.date}</span> : null}
              </div>
              <strong>{item.meta || item.kind}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Contact({ profile, socialLinks, t }) {
  const title = profile.title || 'Developer';

  return (
    <section id="contact" className="dev-contact">
      <div>
        <span className="dev-section__eyebrow">Contact</span>
        <h2>Build mode: available</h2>
        <p>{t('contactAvailable', { title })}</p>
      </div>
      {hasItems(socialLinks) ? (
        <nav className="dev-contact__links" aria-label="Social links">
          {socialLinks.map((link) => (
            <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
              {link.platform}
            </ExternalLink>
          ))}
        </nav>
      ) : null}
    </section>
  );
}

export default function DeveloperTemplate({ profile }) {
  const t = useTranslations('publicProfile');
  const te = useTranslations('educationType');

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNavShrunk, setIsNavShrunk] = useState(false);
  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const socialLinks = profile.socialLinks ?? [];
  const displayName = profile.fullName || profile.username || 'Developer';

  useEffect(() => {
    const updateNav = () => setIsNavShrunk(window.scrollY > 18);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
    return () => window.removeEventListener('scroll', updateNav);
  }, []);

  const closeNav = () => setIsNavOpen(false);

  return (
    <div className="dev-os">
      <header className={`dev-nav${isNavShrunk ? ' dev-nav--shrink' : ''}${isNavOpen ? ' dev-nav--open' : ''}`}>
        <a className="dev-nav__brand" href="#home">
          <span>
            {profile.avatarUrl ? (
              <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || 'Profile avatar'} />
            ) : (
              initials(profile)
            )}
          </span>
          <strong>{displayName}</strong>
        </a>
        <button
          className="dev-nav__toggle"
          type="button"
          aria-label="Menu"
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav>
          <a href="#home" onClick={closeNav}>Home</a>
          {hasItems(skills) ? <a href="#stack" onClick={closeNav}>Stack</a> : null}
          {hasItems(projects) ? <a href="#projects" onClick={closeNav}>Projects</a> : null}
          {hasItems(experiences) || hasItems(educations) ? <a href="#experience" onClick={closeNav}>Experience</a> : null}
          <a href="#contact" onClick={closeNav}>Contact</a>
        </nav>
      </header>

      <main>
        <section id="home" className="dev-hero">
          <div className="dev-hero__content">
            <span className="dev-terminal-line"><span>$</span> whoami</span>
            <h1>{displayName}</h1>
            {profile.title ? <strong>{profile.title}</strong> : null}
            {profile.bio ? <p>{profile.bio}</p> : null}
            <div className="dev-hero__actions">
              {hasItems(projects) ? <a href="#projects">View projects</a> : null}
              <a href="#contact">Contact</a>
            </div>
          </div>

          <div className="dev-hero__visual">
            <CodeEditorPreview profile={profile} projects={projects} skills={skills} />
          </div>
        </section>

        <TechStack skills={skills} t={t} />
        <Projects projects={projects} t={t} />
        <Stats projects={projects} skills={skills} experiences={experiences} />
        <Timeline experiences={experiences} educations={educations} t={t} te={te} />

        <Contact profile={profile} socialLinks={socialLinks} t={t} />
      </main>

      <footer className="dev-footer">
        <span>Built with Procraft</span>
        <nav>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.telegram}>Telegram</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.email}>Email</ExternalLink>
          <span aria-disabled="true">Instagram</span>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.youtube}>YouTube</ExternalLink>
        </nav>
      </footer>
    </div>
  );
}
