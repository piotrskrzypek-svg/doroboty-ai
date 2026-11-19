import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "../prototype/shell";
import { Field } from "../prototype/workspace";
import { cloudClient } from "../auth/client";
import { useCloudSession } from "../auth/session";
import {
  accessRole,
  accessRoleLabels,
  accountRoute,
  preferredRole,
  type AccessRole,
} from "../auth/roles";
type PilotClient = SupabaseClient;
type Job = { id: string; title: string; recruiter_id: string; published: boolean };
type Application = { id: string; job_id: string; candidate_id: string; answer: string };
export function PilotPage() {
  const [params] = useSearchParams();
  const role = accessRole(params.get("role") ?? preferredRole());
  return (
    <SupabaseAccess
      title={
        role === "candidate" ? "Oferty i moje zgłoszenia" : `Zgłoszenia — ${accessRoleLabels[role]}`
      }
      role={role}
    >
      {(client, userId) => (
        <PilotApplications
          client={client}
          key={`${userId}:${role}`}
          userId={userId}
          candidateView={role === "candidate"}
        />
      )}
    </SupabaseAccess>
  );
}
type AccessProps = {
  title: string;
  employer?: boolean;
  role?: AccessRole;
  children: (client: PilotClient, userId: string) => ReactNode;
};
export function SupabaseAccess({
  title,
  employer = false,
  role: requested,
  children,
}: AccessProps) {
  const session = useCloudSession();
  const [params] = useSearchParams();
  const fallback = employer
    ? preferredRole() === "hiring_manager"
      ? "hiring_manager"
      : "recruiter"
    : "candidate";
  const role = requested ?? accessRole(params.get("role") ?? fallback);
  const [error, setError] = useState("");
  if (!cloudClient || session === null)
    return <Navigate to={`/auth/sign-in?mode=account&role=${role}`} replace />;
  if (session === undefined) return <p role="status">Sprawdzam logowanie…</p>;
  return (
    <div className="prototype-section space-y-5">
      <PageTitle>{title}</PageTitle>
      <p>
        Zalogowano: {session.user.email} · {accessRoleLabels[role]}
      </p>
      <p>Do testów używaj wyłącznie fikcyjnych ofert i zgłoszeń.</p>
      <nav className="flex flex-wrap gap-3" aria-label="Panel zalogowanego konta">
        <Link className={buttonVariants({ variant: "outline" })} to={`/auth/sign-in?role=${role}`}>
          Zmień rolę lub wybierz demo
        </Link>
        {role !== "candidate" && (
          <>
            <Link className={buttonVariants({ variant: "outline" })} to={accountRoute(role)}>
              Moje oferty
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} to={`/pilot?role=${role}`}>
              Zgłoszenia do moich ofert
            </Link>
          </>
        )}
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const service = cloudClient;
              if (!service) return;
              const result = await service.auth.signOut({ scope: "local" });
              if (result.error) throw result.error;
            } catch {
              setError("Nie udało się wylogować. Spróbuj ponownie.");
            }
          }}
        >
          Wyloguj się
        </Button>
      </nav>
      {error && <p role="alert">{error}</p>}
      <div key={session.user.id}>{children(cloudClient, session.user.id)}</div>
    </div>
  );
}
function PilotApplications({
  client,
  userId,
  candidateView,
}: {
  client: PilotClient;
  userId: string;
  candidateView: boolean;
}) {
  const [records, setRecords] = useState<{ jobs: Job[]; applications: Application[] }>();
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        let applicationsQuery = client
          .from("pilot_applications")
          .select("id,job_id,candidate_id,answer")
          .order("submitted_at", { ascending: false });
        if (candidateView) applicationsQuery = applicationsQuery.eq("candidate_id", userId);
        const [jobs, applications] = await Promise.all([
          client
            .from("pilot_jobs")
            .select("id,title,recruiter_id,published")
            .order("title")
            .abortSignal(controller.signal),
          applicationsQuery.abortSignal(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (jobs.error || applications.error) throw new Error("Pilot read failed");
        setRecords({ jobs: jobs.data, applications: applications.data });
        setReadError(false);
      } catch {
        if (!controller.signal.aborted) setReadError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [client, refresh, candidateView, userId]);

  async function submit(event: FormEvent<HTMLFormElement>, jobId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answer = String(form.get("answer")).trim();
    setError("");
    if (answer.length < 20) {
      setError("Wpisz co najmniej 20 znaków.");
      return;
    }
    setBusy(true);
    try {
      const result = await client.from("pilot_applications").insert({ job_id: jobId, answer });
      if (result.error?.code === "23505") {
        setError("Zgłoszenie do tej oferty już istnieje.");
        setRefresh((value) => value + 1);
      } else if (result.error) {
        setError("Nie udało się zapisać zgłoszenia.");
      } else {
        setRefresh((value) => value + 1);
      }
    } catch {
      setError("Nie udało się połączyć z bazą.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4" aria-label="Oferty i zgłoszenia pilota">
      <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>
        Odśwież zgłoszenia
      </Button>
      {readError ? (
        <p role="alert">Nie udało się pobrać ofert i zgłoszeń.</p>
      ) : (
        !records && <p role="status">Pobieram oferty…</p>
      )}
      {error && <p role="alert">{error}</p>}
      {records && !records.jobs.some((job) => candidateView || job.recruiter_id === userId) && (
        <p>Brak ofert przypisanych do tego konta.</p>
      )}
      {records?.jobs.map((job) => {
        if (!candidateView && job.recruiter_id !== userId) return null;
        const entries = records.applications.filter((item) => item.job_id === job.id);
        return (
          <article className="prototype-panel space-y-4" key={job.id}>
            <h2 className="text-xl font-bold">{job.title}</h2>
            {!candidateView && job.recruiter_id === userId ? (
              <>
                <h3 className="text-lg font-bold">Zgłoszenia: {entries.length}</h3>
                {entries.length === 0 ? (
                  <p>Brak zgłoszeń.</p>
                ) : (
                  <ul className="space-y-3">
                    {entries.map((entry, index) => (
                      <li className="border border-current p-4" key={entry.id}>
                        <h4 className="mb-3 font-bold">Zgłoszenie {index + 1}</h4>
                        <p className="break-words whitespace-pre-wrap">{entry.answer}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : entries.some((item) => item.candidate_id === userId) ? (
              <p role="status">Twoje zgłoszenie zostało zapisane.</p>
            ) : (
              job.published &&
              job.recruiter_id !== userId && (
                <form className="space-y-4" onSubmit={(event) => void submit(event, job.id)}>
                  <Field label="Treść zgłoszenia testowego">
                    <Textarea name="answer" minLength={20} maxLength={3000} required />
                  </Field>
                  <Button disabled={busy} type="submit">
                    Wyślij zgłoszenie
                  </Button>
                </form>
              )
            )}
          </article>
        );
      })}
    </section>
  );
}
