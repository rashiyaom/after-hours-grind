import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentryFrontend } from "./lib/sentry.ts";

// Initialize Sentry early for error tracking
initSentryFrontend();

createRoot(document.getElementById("root")!).render(<App />);
