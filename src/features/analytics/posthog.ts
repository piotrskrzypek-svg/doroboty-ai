import posthog from "posthog-js";

export function initializeAnalytics() {
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (!token || !host) {
    if (import.meta.env.DEV) {
      for (const [name, value] of Object.entries({
        VITE_POSTHOG_PROJECT_TOKEN: token,
        VITE_POSTHOG_HOST: host,
      })) {
        if (!value)
          console.error(
            new Error(
              `${name} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${name} is configured`,
            ),
          );
      }
    }
    return undefined;
  }
  try {
    posthog.init(token, {
      api_host: host,
      defaults: "2026-08-30",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      capture_exceptions: false,
      person_profiles: "never",
      persistence: "memory",
      before_send: (event) => {
        if (!event || event.event !== "$pageview") return null;
        // Browser URLs can contain arbitrary query strings and local record IDs.
        const route = event.properties.route;
        const { distinct_id, $device_id, $session_id, $lib, $lib_version } = event.properties;
        event.properties = {
          token,
          distinct_id,
          $device_id,
          $session_id,
          $lib,
          $lib_version,
          $current_url: `${window.location.origin}${window.location.pathname}#${route}`,
          $pathname: route,
          $process_person_profile: false,
          route,
        };
        delete event.$set;
        delete event.$set_once;
        return event;
      },
    });
    return posthog;
  } catch {
    if (import.meta.env.DEV) console.error("PostHog initialization failed; analytics is disabled.");
    return undefined;
  }
}

export const analytics = initializeAnalytics();
