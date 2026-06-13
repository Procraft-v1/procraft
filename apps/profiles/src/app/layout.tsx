import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Global metadata (icons, metadataBase) lives here.
// The actual <html lang> and <body> are provided by [locale]/layout.tsx
// so that the lang attribute reflects the active locale.
export const metadata: Metadata = {
  metadataBase: new URL('https://procraft.uz'),
  title: 'Procraft Profiles',
  icons: {
    icon: '/brand/procraft-app-icon-rounded.png',
    apple: '/brand/procraft-app-icon-rounded.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
