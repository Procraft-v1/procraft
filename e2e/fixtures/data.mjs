/**
 * Shared deterministic fixtures used by both the Playwright in-page API mock
 * (browser requests) and the standalone mock API server (profiles SSR).
 * Shapes mirror the real backend contract (camelCase, see docs/API_CONTRACT.md).
 */

export const user = {
  id: 'e2e-user-0000-0000-000000000001',
  email: 'e2e@procraft.uz',
  username: 'e2etester',
  fullName: 'E2E Tester',
  phoneNumber: '+998901234567',
  isEmailConfirmed: true,
};

export const profile = {
  id: 'e2e-profile-0000-0000-000000000001',
  username: user.username,
  fullName: user.fullName,
  title: 'QA Engineer',
  bio: 'Sifatni avtomatlashtirilgan testlar bilan taminlayman.',
  location: 'Tashkent, Uzbekistan',
  avatarUrl: null,
  templateSlug: 'minimal',
  templateId: 'tpl-minimal',
  skills: [{ id: 'sk1', name: 'Playwright', level: 5, category: 'QA' }],
  projects: [
    {
      id: 'pr1',
      name: 'Procraft E2E suite',
      description: 'Regression toplami',
      githubUrl: 'https://github.com/procraft/e2e',
      liveUrl: null,
      isRepositoryPrivate: false,
    },
  ],
  workExperiences: [
    {
      id: 'ex1',
      experienceType: 'work',
      company: 'Procraft',
      position: 'QA Engineer',
      startDate: '2024-01-01',
      endDate: null,
      isCurrent: true,
    },
  ],
  educations: [],
  certificates: [],
  socialLinks: [{ id: 'sl1', platform: 'GitHub', url: 'https://github.com/e2etester' }],
};

export const templates = [
  { id: 'tpl-minimal', slug: 'minimal', name: 'Minimal', previewUrl: null },
  { id: 'tpl-modern', slug: 'modern', name: 'Modern', previewUrl: null },
  { id: 'tpl-classic', slug: 'classic', name: 'Classic', previewUrl: null },
  { id: 'tpl-editorial', slug: 'editorial', name: 'Editorial', previewUrl: null },
  { id: 'tpl-developer', slug: 'developer', name: 'Developer', previewUrl: null },
];

export const analyticsSummary = {
  totalViews: 42,
  last30DaysViews: 17,
  topCountries: [
    { country: 'Uzbekistan', count: 30 },
    { country: 'Unknown', count: 12 },
  ],
  viewsByDate: [
    { date: '2026-06-10', count: 5 },
    { date: '2026-06-11', count: 12 },
  ],
  recentVisitors: [{ city: 'Tashkent', country: 'Uzbekistan', time: '5 minutes ago' }],
};

export const publicProfile = {
  ...profile,
  // The public endpoint serves the same shape the SSR templates consume.
};

/** Tiny valid-enough PDF payload for download tests. */
export const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
