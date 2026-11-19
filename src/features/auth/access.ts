import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessRole } from "./roles";
export async function verifyAccountAccess(
  client: SupabaseClient,
  userId: string,
  role: AccessRole,
) {
  if (role === "candidate") return;
  const result = await client
    .from("employer_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error) throw new Error("Nie udało się sprawdzić dostępu. Spróbuj ponownie.");
  if (!result.data || result.data.user_id !== userId)
    throw new Error(
      "To konto nie ma dostępu pracodawcy. Możesz wejść jako kandydat lub wybrać gotową osobę do testów. Dostęp pracodawcy włącza właściciel aplikacji.",
    );
}
