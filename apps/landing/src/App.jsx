import Hero from './sections/Hero.jsx';

/** Primary hydration root — defer heavy bundles; keep markup SEO-friendly inside sections. */

export default function App() {
  return (
    <main>
      <Hero />
      {/* Planned: Features, Pricing, FAQ — static-first */}
    </main>
  );
}
