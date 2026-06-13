import { redirect } from 'next/navigation';

import { routes } from '@procraft/config';

// Parity with the legacy SPA: /subscription redirects to the dashboard home.
export default function SubscriptionPage() {
  redirect(routes.dashboard);
}
