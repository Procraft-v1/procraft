import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import uzUZ from "antd/locale/uz_UZ";

import { antDesignThemeToken } from "@procraft/config";

import App from "./App.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      locale={uzUZ}
      theme={{
        cssVar: { key: "pc-admin" },
        algorithm: theme.defaultAlgorithm,
        token: antDesignThemeToken,
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
