import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['uz', 'en', 'ru'],
  defaultLocale: 'uz',
  localePrefix: 'as-needed',
});

export const config = {
  // Skip Next.js internals, static files, API routes, and uploads
  matcher: ['/((?!_next|api|uploads|brand|templates|favicon\\.ico).*)'],
};
