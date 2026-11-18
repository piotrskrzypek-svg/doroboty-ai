import { z } from "zod";
import {
  occupationUri,
  escoProfileSchema,
  searchResponseSchema,
  skillSchema,
} from "../../src/features/esco/contracts";

const root = "https://ec.europa.eu/esco/api/";
const cache = new Map<string, { expires: number; data: unknown }>();
const link = z.object({ uri: z.string(), title: z.string() });
const search = z.object({ _embedded: z.object({ results: z.array(link) }).optional() });
const profile = z.object({
  uri: z.string(),
  title: z.string(),
  description: z.object({ pl: z.object({ literal: z.string() }).optional() }).optional(),
  _links: z.object({
    hasEssentialSkill: z.array(link).optional(),
    hasOptionalSkill: z.array(link).optional(),
  }),
});
async function get(path: string, params: Record<string, string>) {
  const url = new URL(path, root);
  url.search = new URLSearchParams({ language: "pl", ...params }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("ESCO unavailable");
  return response.json();
}
export default async (request: Request) => {
  const headers = { "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" };
  if (request.method !== "GET")
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "GET" } },
    );
  const params = new URL(request.url).searchParams;
  const uri = params.get("uri");
  const q = (params.get("q") ?? "").trim();
  if (
    (uri && (!occupationUri.safeParse(uri).success || params.has("q"))) ||
    (!uri && (q.length < 3 || q.length > 200))
  )
    return Response.json({ error: "Invalid search or occupation URI" }, { status: 400 });
  const key = uri ?? q.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Response.json(hit.data, { headers });
  try {
    let data;
    if (uri) {
      const raw = profile.parse(await get("resource/occupation", { uri }));
      if (raw.uri !== uri) throw new Error("Unexpected occupation");
      const skills = new Map();
      for (const [items, essential] of [
        [raw._links.hasEssentialSkill ?? [], true],
        [raw._links.hasOptionalSkill ?? [], false],
      ] as const) {
        for (const item of items) {
          const parsed = skillSchema.safeParse({ uri: item.uri, label: item.title, essential });
          if (parsed.success && !skills.has(item.uri)) skills.set(item.uri, parsed.data);
        }
      }
      data = escoProfileSchema.parse({
        uri,
        label: raw.title,
        description: raw.description?.pl?.literal ?? "",
        language: "pl",
        skills: [...skills.values()].slice(0, 200),
      });
    } else {
      let query = q;
      let raw = search.parse(await get("search", { text: query, type: "occupation", limit: "8" }));
      if (!raw._embedded?.results.length) {
        const shorter = q
          .replace(/\b(?:AI|senior|junior|lead)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (shorter.length >= 3 && shorter !== q) {
          query = shorter;
          raw = search.parse(await get("search", { text: query, type: "occupation", limit: "8" }));
        }
      }
      data = searchResponseSchema.parse({
        query,
        results: (raw._embedded?.results ?? [])
          .filter((item) => occupationUri.safeParse(item.uri).success)
          .map((item) => ({ uri: item.uri, label: item.title })),
      });
    }
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 600000, data });
    return Response.json(data, { headers });
  } catch {
    return Response.json(
      {
        error:
          "Nie udało się pobrać danych ESCO. Spróbuj ponownie lub uzupełnij ofertę samodzielnie.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
};
export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowLimit: 30,
    windowSize: 60,
  },
};
