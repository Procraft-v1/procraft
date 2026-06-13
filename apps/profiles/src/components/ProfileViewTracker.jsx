'use client';

import { useEffect, useRef } from 'react';
import { useTrackProfileView } from '@procraft/hooks';

/**
 * Client-only analytics ping — keeps the exact legacy semantics: fires once
 * per profile id per mount, never from the server (bots that don't run JS
 * don't inflate view counts, same as before).
 */
export default function ProfileViewTracker({ profileId }) {
  const trackedProfileId = useRef(null);
  const { mutate: trackProfileView } = useTrackProfileView();

  useEffect(() => {
    if (!profileId || trackedProfileId.current === profileId) {
      return;
    }

    trackedProfileId.current = profileId;
    trackProfileView({
      profileId,
      referer: typeof document === 'undefined' ? null : document.referrer,
    });
  }, [profileId, trackProfileView]);

  return null;
}
