import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { analytics } from "./posthog";
import { analyticsRoute } from "./routes";

export function AnalyticsPageviews() {
  const { pathname } = useLocation();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!analytics || previous.current === pathname) return;
    previous.current = pathname;
    try {
      analytics.capture("$pageview", { route: analyticsRoute(pathname) });
    } catch {
      // Analytics must not interrupt navigation.
    }
  }, [pathname]);
  return null;
}
