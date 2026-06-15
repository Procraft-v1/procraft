"use client";

import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ConfigProvider, theme } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import uzUZ from "antd/locale/uz_UZ";
import enUS from "antd/locale/en_US";
import ruRU from "antd/locale/ru_RU";
import { I18nextProvider } from "react-i18next";

import { antDesignThemeToken } from "@procraft/config";
import { configureI18n, i18next } from "@procraft/i18n";
import { configureProcraftStore } from "@procraft/store";
import { AuthProvider } from "@procraft/hooks";

import { createWebQueryClient } from "./query-client.js";

export const PROCRAFT_LANG_STORAGE_KEY = "procraft_lang";
export const SUPPORTED_LANGS = ["uz", "en", "ru"];

const antdLocaleByLang = {
  uz: uzUZ,
  en: enUS,
  ru: ruRU,
};

function getSavedLang() {
  if (typeof window === "undefined") {
    return "uz";
  }

  const saved = window.localStorage.getItem(PROCRAFT_LANG_STORAGE_KEY);
  return SUPPORTED_LANGS.includes(saved) ? saved : "uz";
}

// Bundled resources make this synchronous in practice; mirrors the legacy
// SPA which awaited configureI18n() before mounting. Server render always
// starts at "uz" to match the static <html lang> and avoid hydration drift;
// the saved language is applied after mount.
configureI18n().catch((e) => {
  console.error("i18n failed to load", e);
});

/** Central providers boundary — dashboards keep server state outside Redux. */

export default function Providers({ children }) {
  const [store] = useState(() => configureProcraftStore());
  const [queryClient] = useState(() => createWebQueryClient());
  const [antdLocale, setAntdLocale] = useState(uzUZ);

  useEffect(() => {
    const savedLang = getSavedLang();
    if (savedLang !== i18next.language) {
      i18next.changeLanguage(savedLang);
    }

    const syncAntdLocale = (lng) => {
      setAntdLocale(antdLocaleByLang[lng] ?? uzUZ);
    };

    syncAntdLocale(savedLang);
    i18next.on("languageChanged", syncAntdLocale);
    return () => i18next.off("languageChanged", syncAntdLocale);
  }, []);

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={antdLocale}
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
