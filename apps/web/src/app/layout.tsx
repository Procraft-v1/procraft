import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import Providers from './providers';

import '../shared/styles/global.css';

// Dashboard SPA intentionally de-indexed; primary SEO stays on landing + profiles.
export const metadata: Metadata = {
  title: {
    default: 'Procraft Dashboard',
    template: '%s | Procraft Dashboard',
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/brand/procraft-app-icon-rounded.png',
    apple: '/brand/procraft-app-icon-rounded.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
