import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';

import enUS from 'antd/locale/en_US';
import { I18nextProvider } from 'react-i18next';
import { antDesignThemeToken } from '@procraft/config';
import { i18next } from '@procraft/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function Providers({ children }) {
  return (
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={enUS}
          theme={{
            cssVar: { key: 'pc-profile' },
            algorithm: theme.defaultAlgorithm,
            token: antDesignThemeToken,
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
