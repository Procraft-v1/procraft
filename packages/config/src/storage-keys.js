/**
 * Keys for non-sensitive client persistence only (preferences, drafts not containing secrets).
 * Do NOT store access/refresh tokens, CSRF secrets, or PII requiring encryption — see AUTH_STRATEGY.
 */
export const storageKeys = {
  uiPrefs: 'procraft.ui',
};
