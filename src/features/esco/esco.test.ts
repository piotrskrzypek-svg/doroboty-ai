import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../../netlify/functions/esco.mjs";
import { jobSchema, initialState } from "../prototype/model";
import { parseState, serializeState } from "../prototype/storage";
const uri = "http://data.europa.eu/esco/occupation/e5a63940-57d3-4065-8713-74b4e2c93063";
const skill = {
  uri: "http://data.europa.eu/esco/skill/91abe492-18be-4cce-93c7-0dca07072363",
  title: "umiejętność testowa",
};
afterEach(() => vi.unstubAllGlobals());
describe("ESCO integration boundary", () => {
  it("rejects arbitrary upstream URLs and ambiguous input without fetching", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const query of [
      "uri=https://example.com/secret",
      "q=x",
      `uri=${encodeURIComponent(uri)}&q=test`,
    ]) {
      expect(
        (await handler(new Request(`https://test/.netlify/functions/esco?${query}`))).status,
      ).toBe(400);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects writes", async () => {
    expect((await handler(new Request("https://test/?q=test", { method: "POST" }))).status).toBe(
      405,
    );
  });
  it("discloses the shorter query and only returns occupation identifiers", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ _embedded: { results: [] } }))
      .mockResolvedValueOnce(
        Response.json({
          _embedded: {
            results: [
              { uri, title: "Zawód testowy" },
              { uri: "https://evil.test", title: "Wrong" },
            ],
          },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const response = await handler(new Request("https://test/?q=AI%20unique%20manager"));
    expect(await response.json()).toEqual({
      query: "unique manager",
      results: [{ uri, label: "Zawód testowy" }],
    });
    const url = fetch.mock.calls[1][0] as URL;
    expect(url.origin).toBe("https://ec.europa.eu");
    expect(url.searchParams.get("language")).toBe("pl");
    expect(url.searchParams.get("type")).toBe("occupation");
  });
  it("normalizes Polish details and deduplicates essential/optional skills", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          uri,
          title: "Zawód testowy",
          description: { pl: { literal: "Standardowy opis testowy." } },
          _links: { hasEssentialSkill: [skill], hasOptionalSkill: [skill] },
        }),
      ),
    );
    const response = await handler(new Request(`https://test/?uri=${encodeURIComponent(uri)}`));
    expect(await response.json()).toEqual({
      uri,
      label: "Zawód testowy",
      description: "Standardowy opis testowy.",
      language: "pl",
      skills: [{ uri: skill.uri, label: skill.title, essential: true }],
    });
  });
  it("returns a recoverable failure without exposing provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private provider details")));
    const response = await handler(new Request("https://test/?q=unavailable-search"));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("private provider details");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("round-trips optional metadata in existing version-one scenario saves", () => {
    const state = initialState();
    state.jobs[0] = jobSchema.parse({
      ...state.jobs[0],
      escoProfile: {
        uri,
        label: "Zawód testowy",
        description: "Standardowy opis testowy.",
        language: "pl",
        skills: [{ uri: skill.uri, label: skill.title, essential: true }],
      },
    });
    expect(parseState(serializeState(state)).jobs[0].escoProfile).toEqual(
      state.jobs[0].escoProfile,
    );
    expect(jobSchema.safeParse(initialState().jobs[1]).success).toBe(true);
  });
});
