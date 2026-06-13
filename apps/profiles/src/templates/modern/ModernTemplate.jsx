'use client';

import { useTranslations } from 'next-intl';
import { Typography } from "antd";
import { resolveAssetUrl } from "@procraft/config";
import "./ModernTemplate.css";

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function formatDateRange(startDate, endDate, isCurrent, present) {
  return [startDate, isCurrent ? present : endDate].filter(Boolean).join(" – ");
}

function initials(profile) {
  return (profile.fullName || profile.username || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ExternalLink({ href, children, className }) {
  if (!href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function NavBar({ profile, projects, skills, experiences, certificates, socialLinks, t }) {
  return (
    <header className="mw-nav">
      <a href="#top" className="mw-nav__logo">
        <span className="mw-nav__logo-text">
          {(profile.fullName || profile.username || "Portfolio")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 3)}
        </span>
      </a>

      <nav className="mw-nav__links">
        {hasItems(projects) && <a href="#projects">{t('projects')}</a>}
        {hasItems(skills) && <a href="#skills">{t('skills')}</a>}
        {hasItems(experiences) && <a href="#experience">{t('experience')}</a>}
        {hasItems(certificates) && <a href="#certificates">{t('certificates')}</a>}
        {hasItems(socialLinks) && <a href="#contact">{t('contact')}</a>}
      </nav>

      {hasItems(socialLinks) && (
        <a href="#contact" className="mw-nav__cta">
          {t('connect')}
        </a>
      )}
    </header>
  );
}

function HeroSection({ profile, projects, skills, experiences, certificates, t }) {
  const name = profile.fullName || profile.username || "";
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ");

  return (
    <section id="top" className="mw-hero">
      <span className="mw-hero__watermark" aria-hidden="true">
        {initials(profile)}
      </span>

      <aside className="mw-hero__meta">
        <div className="mw-hero__meta-line" aria-hidden="true" />

        {profile.title && (
          <div className="mw-hero__role">
            <span className="mw-label">rol</span>
            <span>{profile.title}</span>
          </div>
        )}

        {profile.location && (
          <div className="mw-hero__role">
            <span className="mw-label">joylashuv</span>
            <span>{profile.location}</span>
          </div>
        )}

        <div className="mw-hero__stats">
          {hasItems(projects) && (
            <div className="mw-stat">
              <strong>{String(projects.length).padStart(2, "0")}</strong>
              <span>{t('statProjects')}</span>
            </div>
          )}
          {hasItems(skills) && (
            <div className="mw-stat">
              <strong>{String(skills.length).padStart(2, "0")}</strong>
              <span>{t('statSkills')}</span>
            </div>
          )}
          {hasItems(experiences) && (
            <div className="mw-stat">
              <strong>{String(experiences.length).padStart(2, "0")}</strong>
              <span>{t('statExperience')}</span>
            </div>
          )}
          {hasItems(certificates) && (
            <div className="mw-stat">
              <strong>{String(certificates.length).padStart(2, "0")}</strong>
              <span>{t('statCertificates')}</span>
            </div>
          )}
        </div>
      </aside>

      <div className="mw-hero__center">
        <h1 className="mw-hero__name">
          <span className="mw-hero__name-first">{firstName}</span>
          {lastName && <span className="mw-hero__name-last">{lastName}</span>}
        </h1>

        {profile.bio && <p className="mw-hero__bio">{profile.bio}</p>}

        <div className="mw-hero__actions">
          {hasItems(projects) && (
            <a href="#projects" className="mw-btn mw-btn--fill">
              <span>{t('viewWork')}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
          {hasItems(socialLinks) && (
            <a href="#contact" className="mw-btn mw-btn--ghost">
              {t('contact')}
            </a>
          )}
        </div>
      </div>

      <aside className="mw-hero__avatar-wrap">
        <div className="mw-hero__avatar-ring" aria-hidden="true" />
        <div className="mw-avatar">
          {profile.avatarUrl ? (
            <img src={resolveAssetUrl(profile.avatarUrl)} alt={profile.fullName || "Profile"} />
          ) : (
            <span>{initials(profile)}</span>
          )}
        </div>
      </aside>
      <div className="mw-hero__scroll-hint" aria-hidden="true">
        <div className="mw-hero__scroll-line" />
        <span>scroll</span>
      </div>
    </section>
  );
}

function ProjectsSection({ projects, t }) {
  if (!hasItems(projects)) return null;
  return (
    <section id="projects" className="mw-section">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Portfolio</span>
        <h2 className="mw-section__title">
          {t('selectedProjects')}
        </h2>
      </div>

      <div className="mw-projects">
        {projects.map((project, index) => (
          <article className="mw-project" key={project.id || project.name}>
            <div className="mw-project__index">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>

            <div className="mw-project__body">
              <header className="mw-project__header">
                <h3 className="mw-project__title">{project.name}</h3>
                <div className="mw-project__links">
                  {project.isRepositoryPrivate && (
                    <span className="mw-tag mw-tag--dim">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      {t('privateRepo')}
                    </span>
                  )}
                  {!project.isRepositoryPrivate && project.githubUrl && (
                    <ExternalLink href={project.githubUrl} className="mw-project__link">
                      GitHub
                    </ExternalLink>
                  )}
                  {project.liveUrl && (
                    <ExternalLink href={project.liveUrl} className="mw-project__link mw-project__link--live">
                      Live
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </ExternalLink>
                  )}
                </div>
              </header>

              {project.description && (
                <p className="mw-project__desc">{project.description}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SkillsSection({ skills, t }) {
  if (!hasItems(skills)) return null;

  const grouped = skills.reduce((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const hasCategories = Object.keys(grouped).length > 1 || !grouped["Other"];

  return (
    <section id="skills" className="mw-section mw-section--alt">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Expertise</span>
        <h2 className="mw-section__title">{t('skills')}</h2>
      </div>

      {hasCategories ? (
        <div className="mw-skills-grouped">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mw-skills-group">
              <span className="mw-skills-group__label">{cat}</span>
              <div className="mw-skills-wall">
                {items.map((skill) => (
                  <span key={skill.id || skill.name} className="mw-skill">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mw-skills-wall">
          {skills.map((skill) => (
            <span key={skill.id || skill.name} className="mw-skill">
              {skill.name}
              {skill.category && <small>{skill.category}</small>}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ExperienceSection({ experiences, t, te, tx }) {
  if (!hasItems(experiences)) return null;

  return (
    <section id="experience" className="mw-section">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Work</span>
        <h2 className="mw-section__title">{t('experience')}</h2>
      </div>

      <div className="mw-timeline">
        {experiences.map((item, i) => (
          <article className="mw-timeline__item" key={item.id || `${item.company}-${item.position}`}>
            <div className="mw-timeline__dot">
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="mw-timeline__content">
              <div className="mw-timeline__top">
                <h3 className="mw-timeline__pos">{item.position}</h3>
                <span className="mw-timeline__date">
                  {formatDateRange(item.startDate, item.endDate, item.isCurrent, t('now'))}
                </span>
              </div>
              <div className="mw-timeline__meta">
                <strong className="mw-timeline__company">{item.company}</strong>
                <span className="mw-tag">
                  {tx(item.experienceType ?? 'work')}
                </span>
              </div>
              {item.description && (
                <p className="mw-timeline__desc">{item.description}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EducationSection({ educations, t, te }) {
  if (!hasItems(educations)) return null;
  return (
    <section id="education" className="mw-section mw-section--alt">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Education</span>
        <h2 className="mw-section__title">{t('education')}</h2>
      </div>

      <div className="mw-creds">
        {educations.map((item) => (
          <article className="mw-cred-card" key={item.id || item.institution}>
            <div className="mw-cred-card__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 6l8 4 8-4-8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M2 10l8 4 8-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M2 14l8 4 8-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <strong className="mw-cred-card__name">{item.institution}</strong>
              <span className="mw-cred-card__type">
                {te(item.educationType ?? 'formal')}
              </span>
              {[item.degree, item.field].filter(Boolean).length > 0 && (
                <p className="mw-cred-card__detail">
                  {[item.degree, item.field].filter(Boolean).join(" — ")}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CertificatesSection({ certificates, t }) {
  if (!hasItems(certificates)) return null;
  return (
    <section id="certificates" className="mw-section mw-section--alt">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Certificates</span>
        <h2 className="mw-section__title">{t('certificates')}</h2>
      </div>

      <div className="mw-creds">
        {certificates.map((item) => (
          <article className="mw-cred-card" key={item.id || item.name}>
            <div className="mw-cred-card__icon mw-cred-card__icon--cert" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <strong className="mw-cred-card__name">{item.name}</strong>
              {item.issuer && <span className="mw-cred-card__type">{item.issuer}</span>}
              {item.issuedOn && <span className="mw-cred-card__type">{item.issuedOn}</span>}
              {item.url && (
                <ExternalLink href={resolveAssetUrl(item.url)} className="mw-cred-card__link">
                  {t('viewCertificate')} →
                </ExternalLink>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ socialLinks, t }) {
  if (!hasItems(socialLinks)) return null;
  return (
    <footer id="contact" className="mw-contact">
      <div className="mw-contact__bg-text" aria-hidden="true">hello</div>

      <div className="mw-contact__inner">
        <div className="mw-contact__head">
          <span className="mw-eyebrow">{t('contact')}</span>
          <h2 className="mw-contact__title">
            {t('contactConnect')}
          </h2>
        </div>

        <nav className="mw-contact__links" aria-label="Social links">
          {socialLinks.map((link) => (
            <ExternalLink
              key={link.id || `${link.platform}-${link.url}`}
              href={link.url}
              className="mw-contact__link"
            >
              <span className="mw-contact__link-platform">{link.platform}</span>
              <span className="mw-contact__link-arrow" aria-hidden="true">↗</span>
            </ExternalLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default function ModernTemplate({ profile }) {
  const t = useTranslations('publicProfile');
  const te = useTranslations('educationType');
  const tx = useTranslations('experienceType');

  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];

  return (
    <div className="mw-root">
      <div className="mw-grain" aria-hidden="true" />

      <NavBar
        profile={profile}
        projects={projects}
        skills={skills}
        experiences={experiences}
        certificates={certificates}
        socialLinks={socialLinks}
        t={t}
      />

      <main className="mw-main">
        <HeroSection
          profile={profile}
          projects={projects}
          skills={skills}
          experiences={experiences}
          certificates={certificates}
          t={t}
        />

        <ProjectsSection projects={projects} t={t} />
        <SkillsSection skills={skills} t={t} />
        <ExperienceSection experiences={experiences} t={t} te={te} tx={tx} />
        <EducationSection educations={educations} t={t} te={te} />
        <CertificatesSection certificates={certificates} t={t} />
        <ContactSection socialLinks={socialLinks} t={t} />
      </main>
    </div>
  );
}
