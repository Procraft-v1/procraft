"use client";

import { useEffect } from 'react';
import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@procraft/hooks';

/**
 * Client-side guard (auth state lives behind httpOnly cookies on the API
 * domain, so it can only be checked from the browser). Matches the legacy
 * SPA behavior: spinner while the session check runs, redirect to /login
 * with returnTo when unauthenticated.
 */
export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    const search = typeof window === 'undefined' ? '' : window.location.search;
    const returnTo = `${pathname}${search}`;
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
