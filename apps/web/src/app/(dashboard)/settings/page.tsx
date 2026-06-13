import type { Metadata } from 'next';

import SettingsPage from '../../../screens/settings/SettingsPage';

export const metadata: Metadata = {
  title: 'Sozlamalar',
};

export default function Page() {
  return <SettingsPage />;
}
