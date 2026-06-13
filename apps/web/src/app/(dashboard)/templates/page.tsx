import type { Metadata } from 'next';

import TemplatesPage from '../../../screens/templates/TemplatesPage';

export const metadata: Metadata = {
  title: 'Shablonlar',
};

export default function Page() {
  return <TemplatesPage />;
}
