import React from "react";
import ReactDOM from "react-dom/client";
import { configureI18n } from "@procraft/i18n";

import App from "./App.jsx";
import Providers from "./providers.jsx";

import "../shared/styles/global.css";

async function bootstrap() {
  try {
    await configureI18n();
  } catch (e) {
    console.error("i18n failed to load", e);
  }
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Providers>
        <App />
      </Providers>
    </React.StrictMode>,
  );
}

bootstrap();
