import type { Person } from "../prototype/model";
export const accessRoles = ["candidate", "recruiter", "hiring_manager"] as const;
export type AccessRole = (typeof accessRoles)[number];
export const accessRoleLabels: Record<AccessRole, string> = {
  candidate: "Kandydat",
  recruiter: "Rekruter",
  hiring_manager: "Hiring manager",
};
export function accessRole(value: string | null | undefined): AccessRole {
  return accessRoles.find((role) => role === value) ?? "candidate";
}
export function accountRoute(role: AccessRole) {
  return role === "candidate" ? "/konto?role=candidate" : `/pracodawca/oferty?role=${role}`;
}
export function demoRole(person: Person): AccessRole | "operator" {
  if (person.role !== "employer") return person.role;
  return person.id === "employer-northstar" ? "hiring_manager" : "recruiter";
}
export function preferredRole(): AccessRole {
  try {
    return accessRole(sessionStorage.getItem("doroboty.access-role"));
  } catch {
    return "candidate";
  }
}
export function rememberRole(role: AccessRole) {
  try {
    sessionStorage.setItem("doroboty.access-role", role);
  } catch {
    /* Role preference is optional, never authorization. */
  }
}
