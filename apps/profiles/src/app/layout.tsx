import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import Providers from './providers';

import '../shared/styles/global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://procraft.uz'),
  title: 'Procraft Profiles',
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
