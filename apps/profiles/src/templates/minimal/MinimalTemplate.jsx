'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Typography } from 'antd';
import { PROCRAFT_CONTACT_LINKS, resolveAssetUrl } from '@procraft/config';
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

function dateRange(startDate, endDate, isCurrent, present) {
  return [startDate, isCurrent ? present : endDate].filter(Boolean).join(' - ');
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

function Section({ id, title, reveal, children }) {
  return (
    <section id={id} className="site-section" data-reveal={reveal || 'up'}>
      <Typography.Title level={2}>{title}</Typography.Title>
      {children}
    </section>
  );
}

export default function MinimalTemplate({ profile }) {
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

  const closeNav = () => setIsNavOpen(false);

  // Reveal-on-scroll: gated behind a root class so content is never hidden
  // before hydration or when motion is reduced (SEO + no-JS friendly).
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
    const targets = root.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={rootRef}
      className={`portfolio-site portfolio-site--minimal${isNavOpen ? ' nav-open' : ''}`}
    >
      <header className="site-nav">
        <a className="site-nav__brand" href="#top" onClick={closeNav}>
          {profile.fullName || profile.username || 'Portfolio'}
        </a>
        <button
          className="site-nav__toggle"
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
          {hasItems(projects) ? <a href="#projects" onClick={closeNav}>{t('projects')}</a> : null}
          {hasItems(experiences) ? <a href="#experience" onClick={closeNav}>{t('experience')}</a> : null}
          {hasItems(skills) ? <a href="#skills" onClick={closeNav}>{t('skills')}</a> : null}
          {hasItems(certificates) ? <a href="#certificates" onClick={closeNav}>{t('certificates')}</a> : null}
          {hasItems(socialLinks) ? <a href="#contact" onClick={closeNav}>{t('contact')}</a> : null}
        </nav>
      </header>

      <section id="top" className="site-hero">
        <div className="site-hero__content" data-reveal="left">
          {profile.title ? <span className="site-kicker">{profile.title}</span> : null}
          <Typography.Title level={1}>{profile.fullName}</Typography.Title>
          {profile.bio ? <Typography.Paragraph>{profile.bio}</Typography.Paragraph> : null}

          <div className="site-hero__actions">
            {hasItems(projects) ? <a href="#projects">{t('viewProjects')}</a> : null}
            {hasItems(socialLinks) ? <a href="#contact">{t('connect')}</a> : null}
          </div>
        </div>

        <aside className="site-hero__card" data-reveal="right">
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
        <Section id="skills" title={t('skills')}>
          <div className="site-skill-groups">
            {skillGroups.map(([category, items]) => (
              <article className="site-skill-card" key={category} data-reveal="up">
                <h3>{category}</h3>
                <div className="site-skills">
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
      ) : null}

      {hasItems(projects) ? (
        <Section id="projects" title={t('projects')}>
          <div className="site-card-grid">
            {projects.map((project, index) => (
              <article
                className="site-card"
                key={project.id || project.name}
                data-reveal={index % 2 === 0 ? 'left' : 'right'}
              >
                <Typography.Title level={3}>{project.name}</Typography.Title>
                {project.description ? <p>{project.description}</p> : null}
                <div className="site-card__links">
                  {project.isRepositoryPrivate ? <span>{t('privateRepo')}</span> : null}
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
        <Section id="experience" title={t('experience')}>
          <div className="site-list">
            {experiences.map((item) => (
              <article
                className="site-row"
                key={item.id || `${item.company}-${item.position}`}
                data-reveal="up"
              >
                <div>
                  <Typography.Title level={3}>{item.position}</Typography.Title>
                  <strong>{item.company}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                <span>{dateRange(item.startDate, item.endDate, item.isCurrent, t('now'))}</span>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="site-two-column">
        {hasItems(educations) ? (
          <Section id="education" title={t('education')}>
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
          <Section id="certificates" title={t('certificates')}>
            <div className="site-stack">
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
          </Section>
        ) : null}
      </div>

      {hasItems(socialLinks) ? (
        <section id="contact" className="site-contact" data-reveal="up">
          <Typography.Title level={2}>{t('connect')}</Typography.Title>
          <div>
            {socialLinks.map((link) => (
              <ExternalLink key={link.id || `${link.platform}-${link.url}`} href={link.url}>
                {link.platform}
              </ExternalLink>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="site-footer">
        <span className="site-footer__brand">Built with Procraft</span>
        <nav>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.telegram}>Telegram</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.youtube}>YouTube</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.email}>Email</ExternalLink>
        </nav>
      </footer>
    </main>
  );
}
