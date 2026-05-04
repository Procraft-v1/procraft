/**
 * Brand + Ant Design token seed (wired in apps via ConfigProvider theme).
 */
export const brandColors = {
  primaryNavy: '#0D1B2A',
  accentBlue: '#2563EB',
  cyanHighlight: '#06B6D4',
  background: '#F6F7F9',
  border: '#E5E7EB',
  mutedText: '#64748B',
  white: '#FFFFFF',
};

export const antdTheme = {
  token: {
    colorPrimary: brandColors.accentBlue,
    colorInfo: brandColors.cyanHighlight,
    colorText: brandColors.primaryNavy,
    colorTextSecondary: brandColors.mutedText,
    colorBgLayout: brandColors.background,
    colorBorder: brandColors.border,
    borderRadius: 12,
    fontFamily:
      "Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

/** Compatible with Ant Design `theme.token` overrides. */
export const antDesignThemeToken = antdTheme.token;
