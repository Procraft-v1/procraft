"use client";

import { ConfigProvider, theme } from "antd";
import uzUZ from "antd/locale/uz_UZ";

import { antDesignThemeToken } from "@procraft/config";

export default function Providers({ children }) {
  return (
    <ConfigProvider
      locale={uzUZ}
      theme={{
        cssVar: { key: "pc-admin" },
        algorithm: theme.defaultAlgorithm,
        token: antDesignThemeToken,
      }}
    >
      {children}
    </ConfigProvider>
  );
}
