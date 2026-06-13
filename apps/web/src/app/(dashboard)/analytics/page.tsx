import type { Metadata } from 'next';

import AnalyticsPage from '../../../screens/analytics/AnalyticsPage';

export const metadata: Metadata = {
  title: 'Analitika',
};

export default function Page() {
  return <AnalyticsPage />;
}
