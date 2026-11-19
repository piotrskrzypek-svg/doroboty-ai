import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initialState } from "../prototype/model";
import { verifyAccountAccess } from "./access";
import { accessRole, accountRoute, demoRole, preferredRole } from "./roles";
function clientStub(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  const from = vi.fn().mockReturnValue(query);
  return { client: { from } as unknown as SupabaseClient, from, query };
}
describe("unified access", () => {
  it("maps demo hiring managers and recruiters without changing domain roles", () => {
    const people = initialState().people;
    expect(demoRole(people.find((person) => person.id === "employer-northstar")!)).toBe(
      "hiring_manager",
    );
    expect(demoRole(people.find((person) => person.id === "employer-brightlabs")!)).toBe(
      "recruiter",
    );
    expect(demoRole(people.find((person) => person.id === "candidate-anna")!)).toBe("candidate");
  });
  it("uses only known role destinations and safe fallbacks", () => {
    expect(accountRoute(accessRole("https://outside.test"))).toBe("/konto?role=candidate");
    expect(accountRoute("hiring_manager")).toBe("/pracodawca/oferty?role=hiring_manager");
    expect(preferredRole()).toBe("candidate");
  });
  it("does not require employer membership for candidate access", async () => {
    const { client, from } = clientStub(null);
    await verifyAccountAccess(client, "candidate", "candidate");
    expect(from).not.toHaveBeenCalled();
  });
  it.each(["recruiter", "hiring_manager"] as const)(
    "does not grant %s access from a role choice alone",
    async (role) => {
      const { client, query } = clientStub(null);
      await expect(verifyAccountAccess(client, "candidate", role)).rejects.toThrow(
        "nie ma dostępu pracodawcy",
      );
      expect(query.eq).toHaveBeenCalledWith("user_id", "candidate");
    },
  );
  it.each(["recruiter", "hiring_manager"] as const)(
    "uses the same owner-scoped membership for %s",
    async (role) => {
      const { client } = clientStub({ user_id: "employer" });
      await expect(verifyAccountAccess(client, "employer", role)).resolves.toBeUndefined();
    },
  );
  it("rejects mismatched membership identities and provider failures", async () => {
    await expect(
      verifyAccountAccess(clientStub({ user_id: "other" }).client, "employer", "recruiter"),
    ).rejects.toThrow("nie ma dostępu pracodawcy");
    await expect(
      verifyAccountAccess(clientStub(null, { message: "private" }).client, "employer", "recruiter"),
    ).rejects.toThrow("Nie udało się sprawdzić dostępu");
  });
});
