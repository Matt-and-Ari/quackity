import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@cloudflare/realtimekit-ui/loader";

import App from "./App.tsx";
import "./style.css";

defineCustomElements(window);

const container = document.getElementById("app");

if (!container) {
  throw new Error("Missing #app root element");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
