import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initialState } from "../prototype/model";
import { cloudOfferDataSchema } from "./contracts";
import { saveCloudOffer } from "./repository";
const offer = cloudOfferDataSchema.parse({
  ...initialState().jobs[0],
  id: "2da709a3-09e3-4777-9294-d06a48e5e3f2",
  companyId: "supabase-employer",
  publicationStatus: "draft",
  verificationStatus: "unverified",
  escoProfile: {
    uri: "http://data.europa.eu/esco/occupation/e5a63940-57d3-4065-8713-74b4e2c93063",
    label: "Profil testowy",
    description: "Opis testowy.",
    language: "pl",
    skills: [
      {
        uri: "http://data.europa.eu/esco/skill/91abe492-18be-4cce-93c7-0dca07072363",
        label: "Umiejętność testowa",
        essential: true,
      },
    ],
  },
});
function clientStub(result: unknown) {
  const query = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  const table = { insert: vi.fn().mockReturnValue(query), update: vi.fn().mockReturnValue(query) };
  const client = { from: vi.fn().mockReturnValue(table) } as unknown as SupabaseClient;
  return { client, table, query };
}
const row = { id: offer.id, data: offer, revision: 1, updated_at: "2026-11-18T20:00:00Z" };
describe("private cloud offer contract", () => {
  it("inserts the complete payload including ESCO without client-supplied ownership", async () => {
    const { client, table } = clientStub({ data: row, error: null });
    expect(await saveCloudOffer(client, offer)).toEqual(row);
    expect(table.insert).toHaveBeenCalledWith({ id: offer.id, data: offer });
    expect(table.update).not.toHaveBeenCalled();
  });
  it("qualifies an edit by identity and expected revision", async () => {
    const { client, table, query } = clientStub({ data: { ...row, revision: 2 }, error: null });
    await saveCloudOffer(client, offer, 1);
    expect(table.update).toHaveBeenCalledWith({ data: offer });
    expect(query.eq.mock.calls).toEqual([
      ["id", offer.id],
      ["revision", 1],
    ]);
  });
  it("reports an unmodified stale write instead of announcing success", async () => {
    const { client } = clientStub({ data: null, error: null });
    await expect(saveCloudOffer(client, offer, 1)).rejects.toThrow("Oferta została zmieniona");
  });
  it("reports an API failure without exposing provider details", async () => {
    const { client } = clientStub({ data: null, error: { message: "private upstream details" } });
    await expect(saveCloudOffer(client, offer)).rejects.toThrow("Nie udało się zapisać oferty");
  });
  it("rejects a response for a mismatched identity", async () => {
    const { client } = clientStub({
      data: { ...row, id: "51eceef6-c866-4083-b299-b2257483790f" },
      error: null,
    });
    await expect(saveCloudOffer(client, offer)).rejects.toThrow("Offer identity mismatch");
  });
  it("does not accept local published records as private cloud drafts", () => {
    expect(cloudOfferDataSchema.safeParse(initialState().jobs[0]).success).toBe(false);
  });
  it("keeps the database JSON schema synchronized with the client contract", () => {
    const migration = readFileSync(
      new URL("../../../supabase/migrations/20261118203906_employer_offers.sql", import.meta.url),
      "utf8",
    );
    const snapshot = JSON.parse(migration.split("$schema$")[1]);
    expect(snapshot).toEqual(z.toJSONSchema(cloudOfferDataSchema));
  });
});
