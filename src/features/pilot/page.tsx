import { useEffect, useState, type FormEvent } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "../prototype/shell";
import { Field } from "../prototype/workspace";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const client = url && key ? createClient(url, key) : null;
type PilotClient = NonNullable<typeof client>;

type Job = { id: string; title: string; recruiter_id: string; published: boolean };
type Application = { id: string; job_id: string; candidate_id: string; answer: string };

export function PilotPage() {
  if (!client) return <p>Ten podgląd nie ma konfiguracji pilota.</p>;
  return <Pilot client={client} />;
}

function Pilot({ client }: { client: PilotClient }) {
  const [session, setSession] = useState<Session | null | undefined>();
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.unsubscribe();
  }, [client]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setNotice("");
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    if (registering && password !== String(form.get("passwordConfirmation"))) {
      setError("Hasła muszą być takie same.");
      return;
    }
    setBusy(true);
    try {
      if (registering) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) {
          setError(
            error.code === "over_email_send_rate_limit"
              ? "Limit wiadomości został osiągnięty. Spróbuj ponownie później."
              : "Nie udało się utworzyć konta. Sprawdź adres i wymagania hasła lub spróbuj później.",
          );
        } else if (!data.session) {
          setNotice(
            "Sprawdź skrzynkę e-mail i potwierdź adres linkiem w wiadomości. Potem wróć na tę stronę i zaloguj się.",
          );
          setRegistering(false);
        }
        return;
      }
      const { error } = await client.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error)
        setError("Logowanie nie powiodło się. Sprawdź dane konta i potwierdzenie adresu e-mail.");
    } catch {
      setError("Nie udało się połączyć z usługą logowania.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle>Pilot rekrutacji</PageTitle>
      <p>Do testów używaj wyłącznie fikcyjnych ofert i zgłoszeń.</p>
      {session === undefined ? (
        <p role="status">Sprawdzam logowanie…</p>
      ) : session ? (
        <>
          <Button
            variant="outline"
            onClick={async () => {
              setError("");
              try {
                const { error } = await client.auth.signOut({ scope: "local" });
                if (error) setError("Nie udało się wylogować. Spróbuj ponownie.");
              } catch {
                setError("Nie udało się wylogować. Spróbuj ponownie.");
              }
            }}
          >
            Wyloguj się
          </Button>
          <PilotApplications client={client} key={session.user.id} userId={session.user.id} />
        </>
      ) : (
        <form className="prototype-panel max-w-lg space-y-4" onSubmit={signIn}>
          <h2 className="text-xl font-bold">
            {registering ? "Utwórz konto kandydata" : "Zaloguj się"}
          </h2>
          {notice && <p role="status">{notice}</p>}
          <Field label="E-mail">
            <Input name="email" type="email" autoComplete="username" required />
          </Field>
          <Field label="Hasło">
            <Input
              name="password"
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 8 : undefined}
              required
            />
            {registering && <p>Użyj co najmniej 8 znaków.</p>}
          </Field>
          {registering && (
            <Field label="Powtórz hasło">
              <Input
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
          )}
          <Button disabled={busy} type="submit">
            {busy ? "Proszę czekać…" : registering ? "Utwórz konto" : "Zaloguj się"}
          </Button>
          <Button
            disabled={busy}
            type="button"
            variant="outline"
            onClick={() => {
              setRegistering((value) => !value);
              setError("");
              setNotice("");
            }}
          >
            {registering ? "Mam już konto — zaloguj się" : "Nowy kandydat — utwórz konto"}
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function PilotApplications({ client, userId }: { client: PilotClient; userId: string }) {
  const [records, setRecords] = useState<{ jobs: Job[]; applications: Application[] }>();
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [jobs, applications] = await Promise.all([
          client
            .from("pilot_jobs")
            .select("id,title,recruiter_id,published")
            .order("title")
            .abortSignal(controller.signal),
          client
            .from("pilot_applications")
            .select("id,job_id,candidate_id,answer")
            .order("submitted_at", { ascending: false })
            .abortSignal(controller.signal),
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
  }, [client, refresh]);

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
      {records?.jobs.length === 0 && <p>Brak dostępnych ofert pilota.</p>}
      {records?.jobs.map((job) => {
        const entries = records.applications.filter((item) => item.job_id === job.id);
        return (
          <article className="prototype-panel space-y-4" key={job.id}>
            <h2 className="text-xl font-bold">{job.title}</h2>
            {job.recruiter_id === userId ? (
              <>
                {entries.length === 0 ? (
                  <p>Brak zgłoszeń.</p>
                ) : (
                  <ul className="space-y-3">
                    {entries.map((entry) => (
                      <li className="break-words whitespace-pre-wrap" key={entry.id}>
                        {entry.answer}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : entries.some((item) => item.candidate_id === userId) ? (
              <p role="status">Twoje zgłoszenie zostało zapisane.</p>
            ) : (
              job.published && (
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
