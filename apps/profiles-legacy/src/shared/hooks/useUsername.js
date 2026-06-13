import { useMemo } from 'react';

import { getSubdomain } from '@procraft/utils';

/**
 * Parses username label from subdomain in production ({username}.procraft.uz).
 * Local dev fallback allows `?username=demo`.
 */

export default function useUsername() {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';

    const search = window.location.search;
    const param = new URLSearchParams(search).get('username');
    if (param) return param;

    return getSubdomain(window.location.hostname);
  }, []);
}
