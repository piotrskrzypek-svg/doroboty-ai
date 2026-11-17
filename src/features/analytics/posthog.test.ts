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
    expect(config.autocapture).toBe(false);
    expect(config.disable_session_recording).toBe(true);
    expect(config.capture_pageview).toBe(false);
    const filter = config.before_send as (
      event: unknown,
    ) => { properties: Record<string, unknown> } | null;
    const event = filter({
      event: "$pageview",
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
    expect(event?.properties.distinct_id).toBe("random-id");
    expect(JSON.stringify(event)).not.toMatch(/private|Private|secret/);
    expect(filter({ event: "$autocapture", properties: {} })).toBeNull();
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
