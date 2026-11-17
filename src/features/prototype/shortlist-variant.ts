export type ShortlistVariant = "A" | "B";

export const SHORTLIST_VARIANT_KEY = "doroboty.shortlist.prototype-variant";
export const SHORTLIST_TEST_MODE_KEY = "doroboty.shortlist.test-mode.v1";

export function shortlistVariant(value: string | null): ShortlistVariant | null {
  return value === "A" || value === "B" ? value : null;
}

export function requestedShortlistVariant(hash: string): ShortlistVariant | null {
  const route = hash.replace(/^#/, "");
  const [pathname, query = ""] = route.split("?", 2);
  return pathname === "/app/kandydaci"
    ? shortlistVariant(new URLSearchParams(query).get("wariant"))
    : null;
}
