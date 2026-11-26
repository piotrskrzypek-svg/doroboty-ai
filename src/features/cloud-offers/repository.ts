import type { SupabaseClient } from "@supabase/supabase-js";
import { cloudOfferDataSchema, offerRowSchema } from "./contracts";
import type { State } from "../prototype/model";

export async function saveCloudOffer(
  client: SupabaseClient,
  value: State["jobs"][number],
  revision?: number,
) {
  const data = cloudOfferDataSchema.parse(value);
  const table = client.from("employer_offers");
  const operation =
    revision === undefined
      ? table.insert({ id: data.id, data })
      : table.update({ data }).eq("id", data.id).eq("revision", revision);
  const result = await operation.select("id,data,revision,updated_at").maybeSingle();
  if (result.error)
    throw new Error(
      "Nie udało się zapisać oferty. Tekst pozostaje w formularzu. Przy niepewnym połączeniu sprawdź listę ofert przed ponowną próbą.",
    );
  if (!result.data)
    throw new Error(
      "Oferta została zmieniona na innym urządzeniu lub utraciłeś dostęp. Skopiuj swoje zmiany i otwórz ofertę ponownie.",
    );
  return offerRowSchema.parse(result.data);
}
