import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LynkDataProvider } from "./lib/LynkDataContext";
import { I18nProvider } from "./lib/i18n";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <LynkDataProvider>
        <App />
      </LynkDataProvider>
    </I18nProvider>
  </StrictMode>
);
