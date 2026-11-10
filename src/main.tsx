import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { PlatformShell } from "./shell/PlatformShell";

import { LynkDataProvider } from "./lib/LynkDataContext";
import { I18nProvider } from "./lib/i18n";

// ?shell opens the platform-shell concept (Lynk as one micro frontend among the
// platform's apps). Without it the prototype starts on the roles board as before.
const isShell =
  import.meta.env.VITE_SHELL === "1" || new URLSearchParams(window.location.search).has("shell");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <LynkDataProvider>
        {isShell ? <PlatformShell /> : <App />}
      </LynkDataProvider>
    </I18nProvider>
  </StrictMode>
);
