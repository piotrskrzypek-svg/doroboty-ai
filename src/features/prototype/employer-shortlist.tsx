import { Link } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { curatedJobId, stageLabels, type Application } from "./model";
import { usePrototype } from "./store";

// This teaching fixture represents a human curator's choices, not an automated assessment.
const shortlist = [
  {
    applicationId: "application-candidate-julia",
    reason: "Prowadziła pilotaż narzędzia dla zespołu finansowego i sprawdzała wynik po wdrożeniu.",
    evidence: "Ustaliłam z zespołem zakres pilotażu, a po wdrożeniu porównałam liczbę poprawek.",
    question: "Które decyzje o zakresie pilotażu podjęła samodzielnie?",
  },
  {
    applicationId: "application-example",
    reason: "Łączy badania użytkowników z wdrożeniem automatyzacji w produkcie B2B.",
    evidence:
      "Poprowadziłem badania z użytkownikami i wdrożenie, które skróciło czas odpowiedzi o 25%.",
    question: "Jak mierzył zmianę czasu odpowiedzi i za które decyzje odpowiadał?",
  },
] as const;

export function EmployerShortlist({
  applications,
  jobId,
}: {
  applications: Application[];
  jobId: string;
}) {
  const { run } = usePrototype();
  const needsDemo =
    jobId === curatedJobId &&
    ["candidate-julia", "candidate-pawel"].some(
      (candidateId) => !applications.some((application) => application.candidateId === candidateId),
    );
  const recommendations =
    jobId === curatedJobId
      ? shortlist
          .map((item) => ({
            ...item,
            application: applications.find(
              (application) =>
                application.id === item.applicationId && application.answer.includes(item.evidence),
            ),
          }))
          .filter((item): item is typeof item & { application: Application } => !!item.application)
      : [];

  return (
    <section className="employer-shortlist" aria-labelledby="shortlist-title">
      <div className="shortlist-heading">
        <div>
          <p className="shortlist-eyebrow">Ręcznie przygotowana lista · scenariusz testowy</p>
          <h2 id="shortlist-title">Kandydaci do rozmowy</h2>
          <p>
            Powody odnoszą się do wymagań oferty i treści zgłoszeń. Sprawdź pełną aplikację przed
            decyzją.
          </p>
        </div>
        <span className="shortlist-count">
          {recommendations.length} {recommendations.length === 1 ? "wskazanie" : "wskazania"}
        </span>
      </div>
      {recommendations.length ? (
        <div className="shortlist-grid">
          {recommendations.map(({ application, reason, evidence, question }) => (
            <article className="shortlist-card" key={application.id}>
              <div className="shortlist-card-top">
                <h3>{application.candidateName}</h3>
                <span className="shortlist-stage">{stageLabels[application.stage]}</span>
              </div>
              <div className="shortlist-copy">
                <p>
                  <strong>Dlaczego na liście:</strong> {reason}
                </p>
                <p>
                  <strong>W aplikacji:</strong> „{evidence}”
                </p>
                <p>
                  <strong>Do sprawdzenia:</strong> {question}
                </p>
              </div>
              <Link
                to={`/app/kandydaci/${application.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Zobacz aplikację i podejmij decyzję
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="shortlist-empty">
          Dla tej oferty nie przygotowano jeszcze wskazań. Wszystkie dostępne zgłoszenia znajdziesz
          poniżej.
        </p>
      )}
      {needsDemo && (
        <div className="shortlist-demo-action">
          <p>Uzupełnij starszy zapis o syntetyczne zgłoszenia do przetestowania wyboru.</p>
          <Button variant="outline" onClick={() => run({ type: "load_shortlist_demo" })}>
            Dodaj przykładowe zgłoszenia
          </Button>
        </div>
      )}
    </section>
  );
}
