import { matchPath } from "react-router";

const routes = [
  "/",
  "/oferty",
  "/oferty/:slug",
  "/firmy/:slug",
  "/metodologia",
  "/polityka-prywatnosci",
  "/auth/:mode",
  "/aplikuj/:slug",
  "/app",
  "/app/onboarding",
  "/app/profil",
  "/app/profil/podglad",
  "/app/zapisane",
  "/app/aplikacje",
  "/app/aplikacje/:id",
  "/app/aplikacje/:id/wyslano",
  "/app/oferty",
  "/app/oferty/:id",
  "/app/organizacja",
  "/app/kandydaci",
  "/app/kandydaci/:id",
  "/app/case",
  "/app/settings",
];

export function analyticsRoute(pathname: string) {
  return routes.find((route) => matchPath(route, pathname.split(/[?#]/)[0])) ?? "/unknown";
}
