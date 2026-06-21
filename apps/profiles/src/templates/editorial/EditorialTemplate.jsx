'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Typography } from 'antd';
import { PROCRAFT_CONTACT_LINKS, resolveAssetUrl, safeHref } from '@procraft/config';
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
  const safe = safeHref(href);
  if (!safe) {
    return null;
  }

  return (
    <a href={safe} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function EditorialSection({ id, index, title, reveal, children }) {
  return (
    <section id={id} className="editorial-section" data-reveal={reveal || 'up'}>
      <Typography.Title level={2}>
        {index ? <span className="editorial-section__num">{index}</span> : null}
        {title}
      </Typography.Title>
      {children}
    </section>
  );
}

export default function EditorialTemplate({ profile }) {
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

  const hasSidebar =
    Boolean(profile.location) ||
    hasItems(socialLinks) ||
    hasItems(skills) ||
    hasItems(educations);
  const hasMain = hasItems(experiences) || hasItems(projects) || hasItems(certificates);

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
      className={`public-template public-template--editorial${isNavOpen ? ' nav-open' : ''}`}
    >
      <header className="editorial-nav">
        <div className="editorial-nav__inner">
          <a className="editorial-nav__brand" href="#top" onClick={closeNav}>
            {displayName}
          </a>
          <button
            className="editorial-nav__toggle"
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
        </div>
      </header>

      <header id="top" className="editorial-hero" data-reveal="up">
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
        {hasItems(projects) || hasItems(socialLinks) ? (
          <div className="editorial-hero__actions">
            {hasItems(projects) ? <a href="#projects">{t('viewProjects')}</a> : null}
            {hasItems(socialLinks) ? <a href="#contact">{t('connect')}</a> : null}
          </div>
        ) : null}
      </header>

      <div className={`editorial-layout${hasSidebar ? '' : ' editorial-layout--single'}`}>
        {hasSidebar ? (
          <aside className="editorial-sidebar">
            <div className="editorial-note" data-reveal="left">
              <strong>Profile</strong>
              <span>{profile.title || displayName}</span>
            </div>

            {hasItems(socialLinks) ? (
              <EditorialSection id="contact" title={t('contact')} reveal="left">
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
              <EditorialSection id="skills" title={t('skills')} reveal="left">
                <div className="editorial-skill-groups">
                  {skillGroups.map(([category, items]) => (
                    <div className="editorial-skill-group" key={category}>
                      <h4>{category}</h4>
                      <div className="editorial-skills">
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
              </EditorialSection>
            ) : null}

            {hasItems(educations) ? (
              <EditorialSection id="education" title={t('education')} reveal="left">
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
            <EditorialSection id="experience" index="01" title={t('experience')} reveal="right">
              <div className="editorial-timeline">
                {experiences.map((item) => (
                  <article key={item.id || `${item.company}-${item.position}`}>
                    <span>{dateRange(item.startDate, item.endDate, item.isCurrent, t('now'))}</span>
                    <div>
                      <Typography.Title level={3}>{item.position}</Typography.Title>
                      <strong>{item.company}</strong>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </EditorialSection>
          ) : null}

          {hasItems(projects) ? (
            <EditorialSection id="projects" index="02" title={t('selectedProjects')} reveal="right">
              <div className="editorial-projects">
                {projects.map((project) => (
                  <article key={project.id || project.name}>
                    <Typography.Title level={3}>{project.name}</Typography.Title>
                    {project.description ? <p>{project.description}</p> : null}
                    <div className="editorial-projects__links">
                      {project.isRepositoryPrivate ? <span>{t('privateRepo')}</span> : null}
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
            <EditorialSection id="certificates" index="03" title={t('certificates')} reveal="right">
              <div className="editorial-stack">
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
            </EditorialSection>
          ) : null}

          {!hasMain ? (
            <section className="editorial-empty">
              <Typography.Title level={2}>{t('emptyTitle')}</Typography.Title>
              <Typography.Paragraph>{t('emptyDesc')}</Typography.Paragraph>
            </section>
          ) : null}
        </div>
      </div>

      <footer className="editorial-footer">
        <span className="editorial-footer__brand">Built with Procraft</span>
        <nav>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.telegram}>Telegram</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.youtube}>YouTube</ExternalLink>
          <ExternalLink href={PROCRAFT_CONTACT_LINKS.email}>Email</ExternalLink>
        </nav>
      </footer>
    </main>
  );
}
