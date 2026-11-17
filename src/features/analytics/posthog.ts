import posthog from "posthog-js";
import { analyticsRoute } from "./routes";
import { sanitizeElements, sanitizeElementChain } from "./elements";

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
      autocapture: {
        dom_event_allowlist: ["click", "change", "submit"],
        capture_value_css_selector_allowlist: [],
      },
      mask_all_text: true,
      mask_all_element_attributes: true,
      disable_session_recording: true,
      disable_surveys: true,
      capture_exceptions: false,
      person_profiles: "never",
      persistence: "memory",
      before_send: (event) => {
        if (!event || !["$pageview", "$autocapture"].includes(event.event)) return null;
        const interaction = event.event === "$autocapture";
        const eventType = event.properties.$event_type;
        if (interaction && !["click", "change", "submit"].includes(eventType)) return null;
        // Browser URLs can contain arbitrary query strings and local record IDs.
        const route = analyticsRoute(
          event.event === "$pageview"
            ? event.properties.route
            : window.location.hash.replace(/^#/, "") || "/",
        );
        const elements = sanitizeElements(event.properties.$elements);
        const chain = sanitizeElementChain(event.properties.$elements_chain);
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
          ...(interaction
            ? {
                $event_type: eventType,
                $elements: elements,
                ...(chain ? { $elements_chain: chain } : {}),
              }
            : {}),
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
