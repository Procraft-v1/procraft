import type { ReactNode } from 'react';
import { Suspense } from 'react';

import DashboardLayout from '../../shared/layouts/DashboardLayout';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
