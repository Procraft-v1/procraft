'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Typography } from 'antd';
import { PROCRAFT_CONTACT_LINKS, resolveAssetUrl } from '@procraft/config';
import './ClassicTemplate.css';

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
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

function dateRange(startDate, endDate, isCurrent, present) {
  return [startDate, isCurrent ? present : endDate].filter(Boolean).join(' - ');
}

function initials(profile) {
  return (profile.fullName || profile.username || 'P')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function groupByCategory(skills, fallback) {
  const groups = new Map();
  for (const skill of skills) {
    const key = skill.category?.trim() || fallback;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(skill);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function ClassicSection({ id, title, reveal, children }) {
  return (
    <section id={id} className="classic-section" data-reveal={reveal || 'up'}>
      <Typography.Title level={2}>{title}</Typography.Title>
      {children}
    </section>
  );
}

export default function ClassicTemplate({ profile }) {
  const t = useTranslations('publicProfile');
  const rootRef = useRef(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];
  const skillGroups = groupByCategory(skills, t('skills'));
  const displayName = profile.fullName || profile.username || 'Portfolio';

  const closeNav = () => setIsNavOpen(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    root.classList.add('reveal-on');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={rootRef}
      className={`public-template public-template--classic${isNavOpen ? ' nav-open' : ''}`}
    >
      <header className="classic-nav">
        <a className="classic-nav__brand" href="#top" onClick={closeNav}>
          {displayName}
        </a>
        <button
          className="classic-nav__toggle"
          type="button"
          aria-label="Menu"
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav>
          {hasItems(experiences) ? <a href="#experience" onClick={closeNav}>{t('experience')}</a> : null}
          {hasItems(projects) ? <a href="#projects" onClick={closeNav}>{t('projects')}</a> : null}
          {hasItems(skills) ? <a href="#skills" onClick={closeNav}>{t('skills')}</a> : null}
          {hasItems(certificates) ? <a href="#certificates" onClick={closeNav}>{t('certificates')}</a> : null}
          {hasItems(socialLinks) ? <a href="#contact" onClick={closeNav}>{t('contact')}</a> : null}
        </nav>
      </header>

      <header id="top" className="classic-hero" data-reveal="up">
        <div className="classic-hero__identity">
          <div className="classic-avatar">
            {profile.avatarUrl ? (
              <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || 'Profile avatar'} />
            ) : (
              <span>{initials(profile)}</span>
            )}
          </div>
          <div className="classic-hero__head">
            {profile.title ? <span className="classic-kicker">{profile.title}</span> : null}
            <Typography.Title level={1}>{profile.fullName}</Typography.Title>
            {profile.location ? <span className="classic-hero__location">{profile.location}</span> : null}
          </div>
        </div>

        {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}

        {hasItems(projects) || hasItems(socialLinks) ? (
          <div className="classic-hero__actions">
            {hasItems(projects) ? <a href="#projects">{t('viewProjects')}</a> : null}
            {hasItems(socialLinks) ? <a href="#contact">{t('connect')}</a> : null}
          </div>
        ) : null}
      </header>

      <div className="classic-layout">
        <div className="classic-main">
          {hasItems(experiences) ? (
            <ClassicSection id="experience" title={t('experience')} reveal="left">
              <div className="classic-list">
                {experiences.map((item) => (
                  <article className="classic-entry" key={item.id || `${item.company}-${item.position}`}>
                    <div className="classic-entry__heading">
                      <Typography.Title level={3}>{item.position}</Typography.Title>
                      <span>{dateRange(item.startDate, item.endDate, item.isCurrent, t('now'))}</span>
                    </div>
                    <strong>{item.company}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(projects) ? (
            <ClassicSection id="projects" title={t('selectedProjects')} reveal="left">
              <div className="classic-project-grid">
                {projects.map((project) => (
                  <article className="classic-card" key={project.id || project.name}>
                    <Typography.Title level={3}>{project.name}</Typography.Title>
                    {project.description ? <p>{project.description}</p> : null}
                    <div className="classic-links">
                      {project.isRepositoryPrivate ? <span>{t('privateRepo')}</span> : null}
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
          {hasItems(socialLinks) ? (
            <ClassicSection id="contact" title={t('contact')} reveal="right">
              <div className="classic-contact">
                {profile.location ? <span className="classic-contact__loc">{profile.location}</span> : null}
                <div className="classic-contact__links">
                  {socialLinks.map((link) => (
                    <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
                      {link.platform}
                    </ExternalLink>
                  ))}
                </div>
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(skills) ? (
            <ClassicSection id="skills" title={t('skills')} reveal="right">
              <div className="classic-skill-groups">
                {skillGroups.map(([category, items]) => (
                  <div className="classic-skill-group" key={category}>
                    <h4>{category}</h4>
                    <div className="classic-skills">
                      {items.map((skill) => (
                        <span key={skill.id || skill.name}>
                          {skill.name}
                          {skill.level ? <small>{skill.level}/5</small> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ClassicSection>
          ) : null}

          {hasItems(educations) ? (
            <ClassicSection id="education" title={t('education')} reveal="right">
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
            <ClassicSection id="certificates" title={t('certificates')} reveal="right">
              <div className="classic-stack">
                {certificates.map((item) => (
                  <article key={item.id || item.name}>
                    <strong>{item.name}</strong>
                    {item.issuer ? <p>{item.issuer}</p> : null}
                    {item.issuedOn ? <p>{item.issuedOn}</p> : null}
                    {item.url ? (
                      <ExternalLink href={resolveAssetUrl(item.url)}>
                        {t('viewCertificate')}
                      </ExternalLink>
                    ) : null}
                  </article>
                ))}
              </div>
            </ClassicSection>
          ) : null}
        </aside>
      </div>

      <footer className="classic-footer">
        <span className="classic-footer__brand">Built with Procraft</span>
        <nav>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.telegram}>Telegram</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.youtube}>YouTube</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.email}>Email</ExternalLink>
        </nav>
      </footer>
    </main>
  );
}
