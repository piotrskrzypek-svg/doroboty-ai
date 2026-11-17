import { describe, expect, it } from "vitest";
import { analyticsRoute } from "./routes";

describe("analytics route privacy", () => {
  it("keeps route identity without candidate IDs, slugs or free-text filters", () => {
    expect(analyticsRoute("/app/kandydaci/private-candidate-id")).toBe("/app/kandydaci/:id");
    expect(analyticsRoute("/oferty/private-title?query=private-text")).toBe("/oferty/:slug");
    expect(analyticsRoute("/app/aplikacje/123/wyslano")).toBe("/app/aplikacje/:id/wyslano");
    expect(analyticsRoute("/oferty?query=private-text")).toBe("/oferty");
  });
  it("never reports arbitrary unknown routes", () => {
    expect(analyticsRoute("/private-text/not-a-route")).toBe("/unknown");
    expect(analyticsRoute("/app/profil")).toBe("/app/profil");
  });
});
