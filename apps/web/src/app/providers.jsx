"use client";

import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ConfigProvider, theme } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import uzUZ from "antd/locale/uz_UZ";
import { I18nextProvider } from "react-i18next";

import { antDesignThemeToken } from "@procraft/config";
import { configureI18n, i18next } from "@procraft/i18n";
import { configureProcraftStore } from "@procraft/store";
import { AuthProvider } from "@procraft/hooks";

import { createWebQueryClient } from "./query-client.js";

// Bundled resources make this synchronous in practice; mirrors the legacy
// SPA which awaited configureI18n() before mounting.
configureI18n().catch((e) => {
  console.error("i18n failed to load", e);
});

/** Central providers boundary — dashboards keep server state outside Redux. */

export default function Providers({ children }) {
  const [store] = useState(() => configureProcraftStore());
  const [queryClient] = useState(() => createWebQueryClient());

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={uzUZ}
            theme={{
              cssVar: { key: "pc" },
              algorithm: theme.defaultAlgorithm,
              token: antDesignThemeToken,
            }}
          >
            <AuthProvider>{children}</AuthProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ReduxProvider>
  );
}
