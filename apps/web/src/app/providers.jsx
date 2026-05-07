import { Provider as ReduxProvider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import uzUZ from 'antd/locale/uz_UZ';
import { I18nextProvider } from 'react-i18next';

import { antDesignThemeToken } from '@procraft/config';
import { i18next } from '@procraft/i18n';
import { configureProcraftStore } from '@procraft/store';

import { createWebQueryClient } from './query-client.js';

const store = configureProcraftStore();

const queryClient = createWebQueryClient();

/** Central providers boundary — dashboards keep server state outside Redux. */

export default function Providers({ children }) {
  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={uzUZ}
            theme={{
              cssVar: { key: 'pc' },
              algorithm: theme.defaultAlgorithm,
              token: antDesignThemeToken,
            }}
          >
            {children}
          </ConfigProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ReduxProvider>
  );
}
