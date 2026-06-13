import type { Metadata } from 'next';
import { Suspense } from 'react';

import ResetPassword from '../../../screens/auth/ResetPassword';

export const metadata: Metadata = {
  title: 'Parolni tiklash',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}
