import { PostHogProvider } from "@posthog/react";
import { analytics } from "./features/analytics/posthog";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./features/prototype/app";
import "./app/globals.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {analytics ? (
      <PostHogProvider client={analytics}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
