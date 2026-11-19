import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { SupabaseAccess } from "../pilot/page";
import { JobEditorForm } from "../prototype/employer";
import { offerRowSchema, type OfferRow } from "./contracts";
import { saveCloudOffer } from "./repository";

export function CloudOffersPage() {
  const [params] = useSearchParams();
  const role = params.get("role") === "hiring_manager" ? "hiring_manager" : "recruiter";
  return (
    <SupabaseAccess
      title={role === "hiring_manager" ? "Oferty — Hiring manager" : "Oferty — Rekruter"}
      employer
      role={role}
    >
      {(client, userId) => <CloudOffers key={userId} client={client} userId={userId} role={role} />}
    </SupabaseAccess>
  );
}
function CloudOffers({
  client,
  userId,
  role,
}: {
  client: SupabaseClient;
  userId: string;
  role: string;
}) {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<OfferRow[]>();
  const [allowed, setAllowed] = useState<boolean>();
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setRecords(undefined);
    setAllowed(undefined);
    setError("");
    async function load() {
      try {
        const membership = await client
          .from("employer_accounts")
          .select("user_id")
          .eq("user_id", userId)
          .abortSignal(controller.signal)
          .maybeSingle();
        if (controller.signal.aborted) return;
        if (membership.error) throw new Error("Read failed");
        if (!membership.data) {
          setAllowed(false);
          return;
        }
        setAllowed(true);
        let query = client
          .from("employer_offers")
          .select("id,data,revision,updated_at")
          .order("updated_at", { ascending: false });
        if (id && id !== "nowa") {
          if (!z.uuid().safeParse(id).success) {
            setRecords([]);
            return;
          }
          query = query.eq("id", id);
        }
        const result = await query.limit(100).abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (result.error) throw new Error("Read failed");
        setRecords(z.array(offerRowSchema).parse(result.data));
      } catch {
        if (!controller.signal.aborted) setError("Nie udało się pobrać ofert. Spróbuj ponownie.");
      }
    }
    void load();
    return () => controller.abort();
  }, [client, userId, id, refresh]);
  const existing = records?.find((row) => row.id === id);
  return (
    <section className="space-y-5" aria-label="Oferty zapisane w bazie">
      <p>
        Zapisane oferty są prywatne i dostępne na Twoim koncie. Zapis nie publikuje ich na
        publicznej liście.
      </p>
      <div className="flex flex-wrap gap-3">
        {id ? (
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={`/pracodawca/oferty?role=${role}`}
          >
            Wróć do zapisanych ofert
          </Link>
        ) : (
          allowed && (
            <Link className={buttonVariants()} to={`/pracodawca/oferty/nowa?role=${role}`}>
              Dodaj ofertę do bazy
            </Link>
          )
        )}
        <Button type="button" variant="outline" onClick={() => setRefresh((value) => value + 1)}>
          Odśwież oferty
        </Button>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : allowed === false ? (
        <p role="status">
          To konto nie ma dostępu pracodawcy. Zaloguj się kontem pracodawcy, dla którego włączono
          zapis ofert.
        </p>
      ) : !records ? (
        <p role="status">Pobieram oferty…</p>
      ) : id ? (
        id !== "nowa" && !existing ? (
          <p role="status">Oferta nie istnieje lub nie masz do niej dostępu.</p>
        ) : (
          <JobEditorForm
            key={id}
            cloud
            companyId="supabase-employer"
            existing={existing?.data}
            onSave={async (data) => {
              await saveCloudOffer(client, data, existing?.revision);
              navigate(`/pracodawca/oferty?zapisano=1&role=${role}`);
            }}
          />
        )
      ) : (
        <>
          {search.get("zapisano") === "1" && <p role="status">Oferta została zapisana w bazie.</p>}
          {records.length === 0 && <p>Nie masz jeszcze zapisanych ofert.</p>}
          {records.length === 100 && <p>Pokazujemy 100 ostatnio zmienionych ofert.</p>}
          <ul className="space-y-4">
            {records.map((row) => (
              <li className="prototype-panel space-y-3" key={row.id}>
                <h2>{row.data.title}</h2>
                <p>{row.data.summary}</p>
                <p>Zapisano: {new Date(row.updated_at).toLocaleString("pl-PL")}</p>
                {row.data.escoProfile && (
                  <p>
                    Profil ESCO: {row.data.escoProfile.label} · wybrane umiejętności:{" "}
                    {row.data.escoProfile.skills.length}
                  </p>
                )}
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  to={`/pracodawca/oferty/${row.id}?role=${role}`}
                >
                  Edytuj ofertę „{row.data.title}”
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
