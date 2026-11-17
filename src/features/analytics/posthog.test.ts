import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { PostHogConfig } from "posthog-js";

const { init } = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { init } }));

beforeEach(() => {
  vi.resetModules();
  init.mockReset();
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "");
  vi.stubEnv("VITE_POSTHOG_HOST", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("optional PostHog setup", () => {
  it("does not initialize without both configuration values", async () => {
    const { analytics } = await import("./posthog");
    expect(analytics).toBeUndefined();
    expect(init).not.toHaveBeenCalled();
  });
  it("only sends sanitized pageview properties", async () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://example.invalid");
    vi.stubGlobal("window", { location: { origin: "https://example.invalid", pathname: "/" } });
    await import("./posthog");
    const config = init.mock.calls[0][1] as PostHogConfig;
    expect(config.autocapture).toEqual({
      dom_event_allowlist: ["click", "change", "submit"],
      capture_value_css_selector_allowlist: [],
    });
    expect(config.mask_all_text).toBe(true);
    expect(config.mask_all_element_attributes).toBe(true);
    expect(config.disable_session_recording).toBe(true);
    expect(config.capture_pageview).toBe(false);
    const filter = config.before_send as (
      event: unknown,
    ) => { properties: Record<string, unknown> } | null;
    const event = filter({
      event: "$pageview",
      $set_once: { initial_url: "Private URL" },
      properties: {
        route: "/oferty/:slug",
        distinct_id: "random-id",
        $current_url: "https://example.invalid/#/oferty/private?q=private",
        $title: "Private title",
        $referrer: "https://example.invalid/?private=secret",
        notes: "Private form content",
      },
    });
    expect(event?.properties.$current_url).toBe("https://example.invalid/#/oferty/:slug");
    expect(event?.properties.token).toBe("phc_test");
    expect(event?.properties.distinct_id).toBe("random-id");
    expect(JSON.stringify(event)).not.toMatch(/private|Private|secret/);
    expect(filter({ event: "$autocapture", properties: {} })).toBeNull();
    expect(filter({ event: "$exception", properties: {} })).toBeNull();
  });
  it("accepts interactions without collecting text, values or raw routes", async () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://example.invalid");
    vi.stubGlobal("window", {
      location: {
        origin: "https://example.invalid",
        pathname: "/",
        hash: "#/aplikuj/private-role?query=private",
      },
    });
    await import("./posthog");
    const config = init.mock.calls[0][1] as PostHogConfig;
    const filter = config.before_send as (event: unknown) => {
      properties: Record<string, unknown>;
    };
    for (const type of ["click", "change", "submit"]) {
      const event = filter({
        event: "$autocapture",
        $set: { name: "private" },
        properties: {
          $event_type: type,
          $elements: [
            { tag_name: "button", nth_child: 2, text: "private", attr__value: "private" },
          ],
          $elements_chain: 'button.private:nth-child="2"[text="private"];form#private',
          $el_text: "private",
          $input_value: "private",
          $current_url: "private",
          notes: "private",
        },
      });
      expect(event.properties.$event_type).toBe(type);
      expect(event.properties.route).toBe("/aplikuj/:slug");
      expect(event.properties.$elements).toEqual([{ tag_name: "button", nth_child: 2 }]);
      expect(event.properties.$elements_chain).toBe('button:nth-child="2"');
      expect(JSON.stringify(event)).not.toContain("private");
    }
  });
  it("keeps the application usable if initialization throws", async () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://example.invalid");
    init.mockImplementation(() => {
      throw new Error("network failure");
    });
    const { analytics } = await import("./posthog");
    expect(analytics).toBeUndefined();
  });
});
