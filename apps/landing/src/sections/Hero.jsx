import '../styles/global.css';

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero__inner">
        <p className="landing-brand">Procraft</p>
        <h1 id="landing-hero-title">Portfolio and résumés built for credibility</h1>
        <p className="landing-lede">
          Host a lightning-fast portfolio, export ATS-friendly PDFs, and understand who visits — without
          bolting dashboards into your marketing shell.
        </p>
      </div>
    </section>
  );
}
