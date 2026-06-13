'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';

import enUS from 'antd/locale/en_US';
import { I18nextProvider } from 'react-i18next';
import { antDesignThemeToken } from '@procraft/config';
import { configureI18n, i18next } from '@procraft/i18n';

configureI18n().catch((e) => {
  console.error('i18n failed to load', e);
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  });
}

export default function Providers({ children }) {
  const [queryClient] = useState(() => createQueryClient());

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
