import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudClient } from "./client";
export function useCloudSession() {
  const [session, setSession] = useState<Session | null | undefined>(
    cloudClient ? undefined : null,
  );
  useEffect(() => {
    if (!cloudClient) return;
    const {
      data: { subscription },
    } = cloudClient.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);
  return session;
}
