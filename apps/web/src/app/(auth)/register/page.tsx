import type { Metadata } from 'next';
import { Suspense } from 'react';

import Register from '../../../screens/auth/Register';

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}
