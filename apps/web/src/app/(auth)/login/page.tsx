import type { Metadata } from 'next';
import { Suspense } from 'react';

import Login from '../../../screens/auth/Login';

export const metadata: Metadata = {
  title: 'Kirish',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
