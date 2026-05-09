import { Typography } from "antd";
import "./ModernTemplate.css";
/* ─── DATA / LOGIC (o'zgartirilmagan) ──────────────────────── */
const educationTypeLabels = {
  formal: "Universitet / kollej",
  course: "Kurs / bootcamp",
  self: "Shaxsiy o'rganish",
  mentor: "Mentor / ustoz",
  online: "Onlayn kurs",
};

const experienceTypeLabels = {
  work: "Ish joyi",
  freelance: "Freelance",
  project: "Shaxsiy loyiha",
  internship: "Amaliyot",
  volunteer: "Volunteer",
};

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function formatDateRange(startDate, endDate, isCurrent) {
  return [startDate, isCurrent ? "Hozir" : endDate].filter(Boolean).join(" – ");
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
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/* ─── UI COMPONENTS ─────────────────────────────────────────── */

function NavBar({ profile, projects, skills, experiences, socialLinks }) {
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
        {hasItems(projects) && <a href="#projects">Loyihalar</a>}
        {hasItems(skills) && <a href="#skills">Ko'nikmalar</a>}
        {hasItems(experiences) && <a href="#experience">Tajriba</a>}
        {hasItems(socialLinks) && <a href="#contact">Aloqa</a>}
      </nav>

      {hasItems(socialLinks) && (
        <a href="#contact" className="mw-nav__cta">
          Bog'lanish
        </a>
      )}
    </header>
  );
}

function HeroSection({ profile, projects, skills, experiences }) {
  const name = profile.fullName || profile.username || "";
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ");

  return (
    <section id="top" className="mw-hero">
      {/* Decorative background name watermark */}
      <span className="mw-hero__watermark" aria-hidden="true">
        {initials(profile)}
      </span>

      {/* Left: meta column */}
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
              <span>Loyiha</span>
            </div>
          )}
          {hasItems(skills) && (
            <div className="mw-stat">
              <strong>{String(skills.length).padStart(2, "0")}</strong>
              <span>Ko'nikma</span>
            </div>
          )}
          {hasItems(experiences) && (
            <div className="mw-stat">
              <strong>{String(experiences.length).padStart(2, "0")}</strong>
              <span>Tajriba</span>
            </div>
          )}
        </div>
      </aside>

      {/* Center: name + bio */}
      <div className="mw-hero__center">
        <h1 className="mw-hero__name">
          <span className="mw-hero__name-first">{firstName}</span>
          {lastName && <span className="mw-hero__name-last">{lastName}</span>}
        </h1>

        {profile.bio && <p className="mw-hero__bio">{profile.bio}</p>}

        <div className="mw-hero__actions">
          {hasItems(projects) && (
            <a href="#projects" className="mw-btn mw-btn--fill">
              <span>Ishlarni ko'rish</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
          {hasItems(projects) && (
            <a href="#contact" className="mw-btn mw-btn--ghost">
              Aloqa
            </a>
          )}
        </div>
      </div>

      {/* Right: avatar */}
      <aside className="mw-hero__avatar-wrap">
        <div className="mw-hero__avatar-ring" aria-hidden="true" />
        <div className="mw-avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName || "Profile"} />
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

function ProjectsSection({ projects }) {
  if (!hasItems(projects)) return null;
  return (
    <section id="projects" className="mw-section">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Portfolio</span>
        <h2 className="mw-section__title">
          Tanlangan
          <br />
          loyihalar
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
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="5"
                          width="8"
                          height="6"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M4 5V3.5a2 2 0 0 1 4 0V5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                      Yopiq repo
                    </span>
                  )}
                  {!project.isRepositoryPrivate && project.githubUrl && (
                    <ExternalLink
                      href={project.githubUrl}
                      className="mw-project__link"
                    >
                      GitHub
                    </ExternalLink>
                  )}
                  {project.liveUrl && (
                    <ExternalLink
                      href={project.liveUrl}
                      className="mw-project__link mw-project__link--live"
                    >
                      Live
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 10L10 2M10 2H5M10 2v5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
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

function SkillsSection({ skills }) {
  if (!hasItems(skills)) return null;

  /* Categorylar bo'yicha guruhlash */
  const grouped = skills.reduce((acc, skill) => {
    const cat = skill.category || "Boshqa";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const hasCategories = Object.keys(grouped).length > 1 || !grouped["Boshqa"];

  return (
    <section id="skills" className="mw-section mw-section--alt">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Expertise</span>
        <h2 className="mw-section__title">Ko'nikmalar</h2>
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

function ExperienceSection({ experiences }) {
  if (!hasItems(experiences)) return null;
  return (
    <section id="experience" className="mw-section">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Work</span>
        <h2 className="mw-section__title">Tajriba</h2>
      </div>

      <div className="mw-timeline">
        {experiences.map((item, i) => (
          <article
            className="mw-timeline__item"
            key={item.id || `${item.company}-${item.position}`}
          >
            <div className="mw-timeline__dot">
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="mw-timeline__content">
              <div className="mw-timeline__top">
                <h3 className="mw-timeline__pos">{item.position}</h3>
                <span className="mw-timeline__date">
                  {formatDateRange(
                    item.startDate,
                    item.endDate,
                    item.isCurrent,
                  )}
                </span>
              </div>
              <div className="mw-timeline__meta">
                <strong className="mw-timeline__company">{item.company}</strong>
                <span className="mw-tag">
                  {experienceTypeLabels[item.experienceType] ??
                    experienceTypeLabels.work}
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

function CredentialsSection({ educations, certificates }) {
  if (!hasItems(educations) && !hasItems(certificates)) return null;
  return (
    <section id="credentials" className="mw-section mw-section--alt">
      <div className="mw-section__head">
        <span className="mw-eyebrow">Credentials</span>
        <h2 className="mw-section__title">
          Ta'lim &amp;
          <br />
          sertifikatlar
        </h2>
      </div>

      <div className="mw-creds">
        {educations.map((item) => (
          <article className="mw-cred-card" key={item.id || item.institution}>
            <div className="mw-cred-card__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2L2 6l8 4 8-4-8-4z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 10l8 4 8-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 14l8 4 8-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <strong className="mw-cred-card__name">{item.institution}</strong>
              <span className="mw-cred-card__type">
                {educationTypeLabels[item.educationType] ??
                  educationTypeLabels.formal}
              </span>
              {[item.degree, item.field].filter(Boolean).length > 0 && (
                <p className="mw-cred-card__detail">
                  {[item.degree, item.field].filter(Boolean).join(" — ")}
                </p>
              )}
            </div>
          </article>
        ))}

        {certificates.map((item) => (
          <article className="mw-cred-card" key={item.id || item.name}>
            <div
              className="mw-cred-card__icon mw-cred-card__icon--cert"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M7 10l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <strong className="mw-cred-card__name">{item.name}</strong>
              {item.issuer && (
                <span className="mw-cred-card__type">{item.issuer}</span>
              )}
              {item.url && (
                <ExternalLink href={item.url} className="mw-cred-card__link">
                  Sertifikatni ko'rish →
                </ExternalLink>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ socialLinks }) {
  if (!hasItems(socialLinks)) return null;
  return (
    <footer id="contact" className="mw-contact">
      <div className="mw-contact__bg-text" aria-hidden="true">
        hello
      </div>

      <div className="mw-contact__inner">
        <div className="mw-contact__head">
          <span className="mw-eyebrow">Aloqa</span>
          <h2 className="mw-contact__title">
            Birga ishlash uchun
            <br />
            <em>bog'laning</em>
          </h2>
        </div>

        <nav className="mw-contact__links" aria-label="Ijtimoiy tarmoqlar">
          {socialLinks.map((link) => (
            <ExternalLink
              key={link.id || `${link.platform}-${link.url}`}
              href={link.url}
              className="mw-contact__link"
            >
              <span className="mw-contact__link-platform">{link.platform}</span>
              <span className="mw-contact__link-arrow" aria-hidden="true">
                ↗
              </span>
            </ExternalLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/* ─── MAIN TEMPLATE ─────────────────────────────────────────── */
export default function ModernTemplate({ profile }) {
  const skills = profile.skills ?? [];
  const projects = profile.projects ?? [];
  const experiences = profile.workExperiences ?? [];
  const educations = profile.educations ?? [];
  const certificates = profile.certificates ?? [];
  const socialLinks = profile.socialLinks ?? [];

  return (
    <div className="mw-root">
      {/* Subtle noise grain overlay */}
      <div className="mw-grain" aria-hidden="true" />

      <NavBar
        profile={profile}
        projects={projects}
        skills={skills}
        experiences={experiences}
        socialLinks={socialLinks}
      />

      <main className="mw-main">
        <HeroSection
          profile={profile}
          projects={projects}
          skills={skills}
          experiences={experiences}
        />

        <ProjectsSection projects={projects} />
        <SkillsSection skills={skills} />
        <ExperienceSection experiences={experiences} />
        <CredentialsSection
          educations={educations}
          certificates={certificates}
        />
        <ContactSection socialLinks={socialLinks} />
      </main>
    </div>
  );
}
