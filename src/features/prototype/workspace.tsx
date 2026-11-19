import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { AccountPanel } from "../auth/account-panel";
import { cloudClient } from "../auth/client";
import {
  accessRole,
  accessRoles,
  accessRoleLabels,
  accountRoute,
  demoRole,
  rememberRole,
} from "../auth/roles";
import { CheckCircle2, FileText } from "lucide-react";
import { ConfettiBurst, type ConfettiOrigin } from "@/components/confetti-burst";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/form-select";
import { JobCard } from "@/features/jobs/job-card";
import { ApplicationOfferPreview } from "@/features/jobs/application-offer-preview";
import { usePrototype } from "./store";
import { currentPerson, publishedJobs, stageLabels, MIN_APPLICATION_ANSWER_LENGTH } from "./model";
import { PageTitle, Empty, NotFound, Notice, PrototypeDisclosure } from "./shell";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { RecruitingApplication } from "./recruiting-application";
import { CandidateApplication } from "./candidate-application";
import { EmployerShortlist } from "./employer-shortlist";
import {
  SHORTLIST_VARIANT_KEY,
  shortlistVariant,
  type ShortlistVariant,
} from "./shortlist-variant";
import heroAllegory from "@/app/illustrations/hero-allegory.png";
import employerAllegory from "@/app/illustrations/employer-allegory.png";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function PersonPicker({
  requiredRole,
}: {
  requiredRole?: "candidate" | "employer" | "operator";
}) {
  const { state, run } = usePrototype();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next");
  const audience = params.get("audience");
  const role = accessRole(
    params.get("role") ??
      (requiredRole === "employer" || audience === "employer" ? "recruiter" : "candidate"),
  );
  const operator = requiredRole === "operator" || audience === "operator";
  const people = state.people.filter((person) =>
    operator ? person.role === "operator" : demoRole(person) === role,
  );
  const [entryError, setEntryError] = useState("");
  const [entering, setEntering] = useState(false);
  const safeNext = next && /^\/(?!\/)/.test(next) && !next.startsWith("/auth") ? next : null;
  const returnTo = requiredRole ? `${pathname}${search}` : null;
  return (
    <section className="prototype-section max-w-4xl">
      <h1>Zaloguj się lub testuj</h1>
      {!operator && (
        <>
          <p className="my-4">
            Wybierz rolę, a potem zaloguj się na własne konto albo użyj gotowej osoby testowej.
          </p>
          <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="Wybierz rolę">
            {accessRoles.map((item) => (
              <Button
                key={item}
                type="button"
                variant={role === item ? "default" : "outline"}
                aria-pressed={role === item}
                disabled={entering}
                onClick={() => {
                  const nextParams = new URLSearchParams(params);
                  nextParams.set("role", item);
                  nextParams.delete("audience");
                  nextParams.delete("next");
                  navigate(`${pathname}?${nextParams}`, { replace: true });
                }}
              >
                {accessRoleLabels[item]}
              </Button>
            ))}
          </div>
          <AccountPanel
            key={role}
            role={role}
            onEnter={() => {
              rememberRole(role);
              if (run({ type: "select_person", id: null })) navigate(accountRoute(role));
            }}
          />
        </>
      )}
      <h2 className="mt-8 mb-3">
        Gotowe osoby do testów{operator ? "" : ` — ${accessRoleLabels[role]}`}
      </h2>
      <PrototypeDisclosure className="mt-4 mb-6" />
      {entryError && <p role="alert">{entryError}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        {people.map((person) => (
          <article key={person.id} className="prototype-panel">
            <h2 className="text-xl">{person.name}</h2>
            <p className="my-4 text-muted-foreground">{person.headline}</p>
            <Button
              variant="outline"
              disabled={entering}
              onClick={async () => {
                setEntering(true);
                setEntryError("");
                try {
                  if (cloudClient) {
                    const { error } = await cloudClient.auth.signOut({ scope: "local" });
                    if (error) throw error;
                  }
                  if (!run({ type: "select_person", id: person.id })) return;
                  const destination =
                    !requiredRole || person.role === requiredRole ? (safeNext ?? returnTo) : null;
                  navigate(
                    person.role === "candidate"
                      ? (destination ?? "/app")
                      : person.role === "employer"
                        ? (destination ?? "/app/oferty")
                        : (destination ?? "/app/case"),
                  );
                } catch {
                  setEntryError("Nie udało się przełączyć na osobę testową. Spróbuj ponownie.");
                } finally {
                  setEntering(false);
                }
              }}
            >
              Wejdź jako {person.name}
            </Button>
          </article>
        ))}
      </div>
      {!operator && (
        <Link className="mt-6 inline-block underline" to="/auth/sign-in?audience=operator">
          Materiały prowadzącego — demo
        </Link>
      )}
    </section>
  );
}
export function RequireRole({
  role,
  children,
}: {
  role?: "candidate" | "employer" | "operator";
  children: ReactNode;
}) {
  const { state } = usePrototype();
  const { pathname, search } = useLocation();
  const person = currentPerson(state);
  if (!person) return <PersonPicker requiredRole={role} />;
  if (role && person.role !== role)
    return (
      <Empty>
        <p className="mb-4">
          Ten widok jest dostępny dla{" "}
          {role === "candidate" ? "kandydata" : role === "employer" ? "pracodawcy" : "prowadzącego"}
          .
        </p>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={`/auth/sign-in?audience=${role}&next=${encodeURIComponent(`${pathname}${search}`)}`}
        >
          Zmień osobę
        </Link>
      </Empty>
    );
  return children;
}
export function WorkspaceHome() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  if (person.role === "operator") return <Navigate to="/app/case" replace />;
  const candidate = person.role === "candidate";
  const applications = state.applications.filter((a) =>
    candidate ? a.candidateId === person.id : a.companyId === person.companyId,
  );
  return (
    <>
      <PageTitle>Witaj, {person.name.split(" ")[0]}</PageTitle>
      <div className="editorial-workspace-lede">
        <p>
          {candidate
            ? "Twoje oferty, aplikacje i następne kroki w jednym miejscu."
            : "Oferty i zgłoszenia, które wymagają Twojej decyzji."}
        </p>
        <figure>
          <img
            src={candidate ? heroAllegory : employerAllegory}
            alt={
              candidate
                ? "Współczesna alegoria AI: antyczna postać z wieńcem"
                : "Współczesna alegoria AI: Talos, antyczny automat"
            }
          />
          <figcaption>Ilustracja AI · współczesna alegoria</figcaption>
        </figure>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          ["Aplikacje", applications.length],
          [
            candidate ? "Zapisane oferty" : "Twoje oferty",
            candidate
              ? state.saved.filter((x) => x.candidateId === person.id).length
              : state.jobs.filter((x) => x.companyId === person.companyId).length,
          ],
          [
            "W trakcie procesu",
            applications.filter((x) => !["rejected", "withdrawn", "hired"].includes(x.stage))
              .length,
          ],
        ].map(([label, value]) => (
          <div className="prototype-panel" key={label}>
            <p className="text-muted-foreground">{label}</p>
            <strong className="mt-3 block text-3xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className={buttonVariants()} to={candidate ? "/oferty" : "/app/kandydaci"}>
          {candidate ? "Przeglądaj oferty" : "Przejrzyj kandydatów"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={candidate ? "/app/profil" : "/app/oferty"}
        >
          {candidate ? "Edytuj profil" : "Zarządzaj ofertami"}
        </Link>
      </div>
    </>
  );
}
export function ProfilePage({ preview = false }: { preview?: boolean }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const [message, setMessage] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      run({
        type: "profile",
        value: {
          name: String(data.get("name")),
          headline: String(data.get("headline")),
          bio: String(data.get("bio")),
          location: String(data.get("location")),
        },
      })
    )
      setMessage("Profil został zapisany.");
  }
  return (
    <>
      <PageTitle
        action={
          <Link
            to={preview ? "/app/profil" : "/app/profil/podglad"}
            className={buttonVariants({ variant: "outline" })}
          >
            {preview ? "Edytuj profil" : "Podgląd profilu"}
          </Link>
        }
      >
        {preview ? person.name : "Twój profil"}
      </PageTitle>
      {preview ? (
        <div className="prototype-panel space-y-4">
          <h2>{person.headline}</h2>
          <p>{person.location}</p>
          <p>{person.bio}</p>
        </div>
      ) : (
        <form onSubmit={save} className="prototype-panel prototype-form">
          <Field label="Imię i nazwisko">
            <Input name="name" required maxLength={200} defaultValue={person.name} />
          </Field>
          <Field label="Nagłówek zawodowy">
            <Input name="headline" required maxLength={200} defaultValue={person.headline} />
          </Field>
          <Field label="Lokalizacja">
            <Input name="location" required maxLength={200} defaultValue={person.location} />
          </Field>
          <Field label="O mnie">
            <Textarea name="bio" maxLength={12000} defaultValue={person.bio} />
          </Field>
          <Button type="submit">Zapisz profil</Button>
          {message && <p role="status">{message}</p>}
        </form>
      )}
      <section className="prototype-panel mt-6">
        <h2 className="mb-4 flex items-center gap-2">
          <FileText className="size-5" />
          CV
        </h2>
        <CvAttachment candidateId={person.id} fallbackText={person.cv} />
      </section>
    </>
  );
}
export function SavedPage() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = publishedJobs(state).filter((job) =>
    state.saved.some((x) => x.candidateId === person.id && x.jobId === job.id),
  );
  return (
    <>
      <PageTitle>Zapisane oferty</PageTitle>
      {jobs.length ? (
        jobs.map((job) => <JobCard key={job.id} job={job} saved />)
      ) : (
        <Empty>
          <p className="mb-4">Nie masz jeszcze zapisanych ofert.</p>
          <Link className={buttonVariants({ variant: "outline" })} to="/oferty">
            Przeglądaj oferty
          </Link>
        </Empty>
      )}
    </>
  );
}
export function ApplyPage() {
  const { slug } = useParams();
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const job = publishedJobs(state).find((x) => x.slug === slug);
  const draft = state.drafts.find((x) => x.jobId === job?.id && x.candidateId === person.id);
  const notes = draft?.notes ?? "";
  const generated = draft?.generated ?? "";
  const [answer, setAnswer] = useState(draft?.answer ?? "");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const submittedOnce = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<ConfettiOrigin | null>(null);
  useEffect(() => {
    if (!submitted) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    const timeout = window.setTimeout(() => navigate("/app/aplikacje?wyslano=1"), delay);
    return () => window.clearTimeout(timeout);
  }, [submitted, navigate]);
  const answerLength = answer.trim().length;
  const answerInvalid = attempted && answerLength < MIN_APPLICATION_ANSWER_LENGTH;
  const consentInvalid = attempted && !consent;
  if (!job) return <NotFound />;
  const existing = state.applications.find(
    (x) => x.jobId === job.id && x.candidateId === person.id,
  );
  if (existing && !submitted)
    return (
      <section className="prototype-section">
        <Notice>Aplikacja na tę ofertę została już wysłana.</Notice>
        <Link to={`/app/aplikacje/${existing.id}`} className={buttonVariants()}>
          Zobacz aplikację
        </Link>
      </section>
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (submittedOnce.current) return;
    setAttempted(true);
    if (answerLength < MIN_APPLICATION_ANSWER_LENGTH) {
      answerInput.current?.focus();
      return;
    }
    if (!consent) {
      document.getElementById("application-consent")?.focus();
      return;
    }
    if (run({ type: "submit", jobId: job!.id, notes, generated, answer, consent })) {
      submittedOnce.current = true;
      setSubmitted(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = sendButton.current?.getBoundingClientRect();
        if (rect)
          setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    }
  }
  return (
    <section className="pp-container application-page">
      <BackLink to={`/oferty/${job.slug}`}>Wróć do oferty</BackLink>
      <header className="application-header">
        <h1>Aplikuj na ofertę</h1>
        <p>Sprawdź ofertę i opowiedz, dlaczego pasujesz do tej roli.</p>
      </header>
      <div className="application-layout">
        <ApplicationOfferPreview job={job} />
        <form
          noValidate
          onSubmit={submit}
          className="record-sheet application-form"
          aria-labelledby="application-form-title"
        >
          <header className="application-form-intro">
            <h2 id="application-form-title">Twoja aplikacja</h2>
            <p>
              Aplikujesz jako <strong>{person.name}</strong>.
            </p>
          </header>
          <section className="application-form-section" aria-labelledby="application-cv-title">
            <h3 id="application-cv-title">Twoje CV</h3>
            <p className="application-help">Do aplikacji dołączymy CV z Twojego profilu.</p>
            <CvAttachment
              candidateId={person.id}
              fallbackText={person.cv}
              layout="row"
              contextLabel="CV z Twojego profilu"
            />
          </section>
          <section
            className="application-form-section application-answer"
            aria-label="Odpowiedź do aplikacji"
          >
            <Field label="Dlaczego pasujesz do tej roli?">
              <Textarea
                disabled={submitted}
                ref={answerInput}
                required
                minLength={MIN_APPLICATION_ANSWER_LENGTH}
                maxLength={12000}
                aria-invalid={answerInvalid || undefined}
                aria-describedby="application-answer-help"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setConsent(false);
                }}
              />
            </Field>
            <p
              id="application-answer-help"
              role={answerInvalid ? "alert" : undefined}
              className={answerInvalid ? "error-message" : "text-sm text-muted-foreground"}
            >
              {answerInvalid
                ? `Odpowiedź jest za krótka. Wpisz co najmniej ${MIN_APPLICATION_ANSWER_LENGTH} znaków (obecnie: ${answerLength}).`
                : `Minimum ${MIN_APPLICATION_ANSWER_LENGTH} znaków. Obecnie: ${answerLength}.`}
            </p>
          </section>
          <div className="application-form-section application-submit">
            <label className="application-consent">
              <Checkbox
                id="application-consent"
                disabled={submitted}
                checked={consent}
                onCheckedChange={(v) => setConsent(v)}
                aria-invalid={consentInvalid || undefined}
                aria-describedby={consentInvalid ? "application-consent-error" : undefined}
                aria-label="Zatwierdzam treść i przesłanie aplikacji"
              />
              <span>
                Zatwierdzam treść aplikacji i przesłanie profilu oraz przykładowego CV pracodawcy.
              </span>
            </label>
            {consentInvalid && (
              <p id="application-consent-error" className="error-message" role="alert">
                Zatwierdź treść aplikacji i jej przesłanie pracodawcy.
              </p>
            )}
            <div className="application-actions">
              <Button
                ref={sendButton}
                type="submit"
                disabled={submitted}
                className="application-send"
              >
                {submitted && <CheckCircle2 aria-hidden="true" />}
                {submitted ? "Wysłano!" : "Wyślij aplikację"}
              </Button>
              <Button
                type="button"
                disabled={submitted}
                variant="outline"
                onClick={() => {
                  if (run({ type: "draft", jobId: job.id, notes, generated, answer }))
                    setMessage("Szkic został zapisany.");
                }}
              >
                Zapisz szkic
              </Button>
            </div>
            <p
              role="status"
              className={submitted || !message ? "sr-only" : "application-save-status"}
            >
              {submitted ? "Wysłano aplikację. Otwieramy listę Twoich aplikacji." : message}
            </p>
            <p className="application-help">
              Prototyp: aplikacja zostaje w tym przeglądarkowym scenariuszu.
            </p>
          </div>
        </form>
      </div>
      <ConfettiBurst origin={confettiOrigin} />
    </section>
  );
}
function savedShortlistVariant(): ShortlistVariant {
  try {
    return shortlistVariant(window.sessionStorage.getItem(SHORTLIST_VARIANT_KEY)) ?? "B";
  } catch {
    return "B";
  }
}

export function ApplicationsPage({ employer = false }: { employer?: boolean }) {
  const { state, testVariant } = usePrototype();
  const person = currentPerson(state)!;
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const requestedVariant = shortlistVariant(params.get("wariant"));
  const [storedVariant, setStoredVariant] = useState(savedShortlistVariant);
  useEffect(() => {
    if (!employer || !requestedVariant) return;
    setStoredVariant(requestedVariant);
    try {
      window.sessionStorage.setItem(SHORTLIST_VARIANT_KEY, requestedVariant);
    } catch {
      // The explicit URL still controls this view when session storage is unavailable.
    }
  }, [employer, requestedVariant]);
  const activeVariant = requestedVariant ?? testVariant ?? storedVariant;
  const jobs = employer ? state.jobs.filter((job) => job.companyId === person.companyId) : [];
  const mostRecentJobId = state.applications
    .filter((application) => application.companyId === person.companyId)
    .at(-1)?.jobId;
  const selectedJobId =
    jobs.find((job) => job.id === params.get("oferta"))?.id ?? mostRecentJobId ?? jobs[0]?.id;
  const employerApplications = state.applications.filter(
    (application) =>
      application.companyId === person.companyId && application.jobId === selectedJobId,
  );
  const applications = state.applications.filter(
    (x) =>
      (employer
        ? x.companyId === person.companyId && x.jobId === selectedJobId
        : x.candidateId === person.id) &&
      `${x.candidateName} ${x.jobTitle}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  return (
    <>
      {employer && <p className="editorial-kicker">DO ROBOTY / STREFA PRACODAWCY / 03</p>}
      <PageTitle>{employer ? "Kandydaci" : "Moje aplikacje"}</PageTitle>
      {employer && (
        <p className="editorial-intro">
          Ludzie za zgłoszeniami. <em>Decyzja należy do Ciebie.</em>
        </p>
      )}
      {params.has("wyslano") && (
        <Notice>
          <CheckCircle2 className="inline size-5" /> Aplikacja została wysłana.
        </Notice>
      )}
      {employer && selectedJobId && (
        <>
          <div className="employer-job-choice">
            <Field label="Oferta, dla której przeglądasz kandydatów">
              <FormSelect
                value={selectedJobId}
                options={jobs.map((job) => ({ value: job.id, label: job.title }))}
                onValueChange={(value) => {
                  setParams({ oferta: value });
                  setQuery("");
                }}
              />
            </Field>
          </div>
          {activeVariant === "B" && (
            <EmployerShortlist applications={employerApplications} jobId={selectedJobId} />
          )}
          <h2 className="all-applications-heading mt-10 mb-4" id="all-applications-title">
            Wszystkie aplikacje do tej oferty ({employerApplications.length})
          </h2>
        </>
      )}
      <Field label={employer ? "Szukaj kandydata lub oferty" : "Szukaj oferty"}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      </Field>
      <div className={employer ? "editorial-applications mt-6" : "mt-6 space-y-4"}>
        {applications.length ? (
          applications.map((a) => (
            <article
              className={employer ? "prototype-panel editorial-application-row" : "prototype-panel"}
              key={a.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    className="text-xl font-semibold text-[var(--gui-link)]"
                    to={`${employer ? "/app/kandydaci" : "/app/aplikacje"}/${a.id}`}
                  >
                    {employer ? a.candidateName : a.jobTitle}
                  </Link>
                  <p className="my-3 text-muted-foreground">
                    {employer
                      ? a.jobTitle
                      : state.companies.find((x) => x.id === a.companyId)?.name}
                  </p>
                  <p>{stageLabels[a.stage]}</p>
                </div>
                <MatchScore score={a.score} />
              </div>
              {employer && <p className="mt-4 text-muted-foreground">{a.summary}</p>}
            </article>
          ))
        ) : (
          <Empty>
            Brak aplikacji spełniających kryteria.
            {query && (
              <Button variant="link" onClick={() => setQuery("")}>
                Wyczyść wyszukiwanie
              </Button>
            )}
          </Empty>
        )}
      </div>
    </>
  );
}
export function ApplicationDetail({ employer = false }: { employer?: boolean }) {
  const { id } = useParams();
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const application = state.applications.find(
    (x) =>
      x.id === id && (employer ? x.companyId === person.companyId : x.candidateId === person.id),
  );
  if (!application) return <NotFound />;
  if (employer) return <RecruitingApplication key={application.id} application={application} />;
  return <CandidateApplication key={application.id} application={application} />;
}
