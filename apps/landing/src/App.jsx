import { Logo } from '@procraft/ui/logo';

const features = [
  ['Portfolio-first profiles', 'Show your work, skills, and story in a focused public profile.'],
  ['Template control', 'Choose a clean design that fits your voice without rebuilding content.'],
  ['Dashboard workflow', 'Edit once, preview quickly, and keep profile content organized.'],
];

const steps = [
  ['Create', 'Register and add your core profile details.'],
  ['Choose', 'Pick Minimal, Modern, or Classic as your public presentation.'],
  ['Share', 'Publish a memorable profile link for clients, recruiters, and teams.'],
];

const faqs = [
  ['Can I change templates later?', 'Yes. Your profile content stays the same while the presentation changes.'],
  ['Is my account protected?', 'Yes. Procraft keeps sign-in sessions protected and avoids showing sensitive details in the app.'],
  ['Are PDF and analytics included?', 'They are planned modules, but this landing page focuses on the live profile workflow.'],
];

export default function App() {
  return (
    <main>
      <header className="landing-header">
        <a className="landing-header__brand" href="/" aria-label="Procraft home">
          <Logo size={34} />
        </a>
        <nav className="landing-header__nav" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <a className="landing-header__button" href="/dashboard">
            Dashboard
          </a>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">Professional profile builder</p>
          <h1 id="landing-hero-title">Build a credible public profile in minutes.</h1>
          <p className="landing-lede">
            Procraft helps independent professionals turn profile details into polished, shareable portfolio pages with
            clean templates and a calm dashboard workflow.
          </p>
          <div className="landing-actions">
            <a className="landing-button landing-button--primary" href="/register">
              Start free
            </a>
            <a className="landing-button landing-button--secondary" href="#templates">
              View templates
            </a>
          </div>
        </div>
        <div className="landing-hero__preview" aria-label="Profile preview">
          <div className="preview-card">
            <div className="preview-card__bar" />
            <p className="preview-card__name">Alex Morgan</p>
            <p className="preview-card__title">Product Designer</p>
            <p className="preview-card__line" />
            <p className="preview-card__body">
              Designing practical systems for teams who need clarity, speed, and trustworthy presentation.
            </p>
          </div>
        </div>
      </section>

      <SectionHeader id="features" label="Features" title="Everything starts with a strong profile." />
      <section className="landing-grid">
        {features.map(([title, text]) => (
          <article className="landing-card" key={title}>
            <span className="landing-card__mark" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <SectionHeader id="how-it-works" label="How it works" title="Simple enough to keep current." />
      <section className="landing-steps">
        {steps.map(([title, text], index) => (
          <article className="landing-step" key={title}>
            <span>{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>

      <SectionHeader id="templates" label="Templates" title="Three clean ways to present the same profile." />
      <section className="template-preview-grid">
        <TemplatePreview name="Minimal" tone="Clean white resume style" variant="minimal" />
        <TemplatePreview name="Modern" tone="Structured cards with blue and cyan accents" variant="modern" />
        <TemplatePreview name="Classic" tone="Formal centered presentation" variant="classic" />
      </section>

      <SectionHeader id="pricing" label="Pricing" title="Start focused. Upgrade when your profile needs more." />
      <section className="pricing-grid">
        <article className="pricing-card">
          <h3>Free</h3>
          <p className="pricing-card__price">$0</p>
          <p>Create a profile, edit core details, and choose a public template.</p>
          <a className="landing-button landing-button--primary" href="/register">
            Create account
          </a>
        </article>
        <article className="pricing-card pricing-card--featured">
          <h3>Pro</h3>
          <p className="pricing-card__price">Soon</p>
          <p>Planned advanced publishing, exports, and insight tools for growing professionals.</p>
          <a className="landing-button landing-button--secondary" href="/dashboard">
            Open dashboard
          </a>
        </article>
      </section>

      <SectionHeader id="faq" label="FAQ" title="The practical bits." />
      <section className="faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <footer className="landing-footer">
        <Logo size={30} />
        <p>Profiles for professionals who care how trust begins.</p>
      </footer>
    </main>
  );
}

function SectionHeader({ id, label, title }) {
  return (
    <section className="section-header" id={id}>
      <p className="landing-eyebrow">{label}</p>
      <h2>{title}</h2>
    </section>
  );
}

function TemplatePreview({ name, tone, variant }) {
  return (
    <article className={`template-preview template-preview--${variant}`}>
      <div className="template-preview__canvas">
        <div />
        <strong>{name}</strong>
        <span />
        <span />
      </div>
      <h3>{name}</h3>
      <p>{tone}</p>
    </article>
  );
}
