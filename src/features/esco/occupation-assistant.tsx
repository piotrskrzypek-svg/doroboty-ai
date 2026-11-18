import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { escoProfileSchema, searchResponseSchema, type EscoProfile } from "./contracts";

export function OccupationAssistant({
  title,
  value,
  onChange,
  onAppend,
}: {
  title: string;
  value?: EscoProfile;
  onChange: (profile: EscoProfile | undefined) => void;
  onAppend: (text: string) => boolean;
}) {
  const [query, setQuery] = useState(title);
  const [results, setResults] = useState<ReturnType<typeof searchResponseSchema.parse>>();
  const [available, setAvailable] = useState<EscoProfile>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setQuery(title);
    setResults(undefined);
    request.current?.abort();
    setBusy(false);
  }, [title]);
  useEffect(() => () => request.current?.abort(), []);
  async function load(uri?: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    if (!uri) setResults(undefined);
    try {
      const response = await fetch(
        `/.netlify/functions/esco?${new URLSearchParams(uri ? { uri } : { q: query.trim() })}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("ESCO request failed");
      const data: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (uri) {
        const next = escoProfileSchema.parse(data);
        setAvailable(next);
        onChange({ ...next, skills: value?.uri === next.uri ? value.skills : [] });
      } else setResults(searchResponseSchema.parse(data));
    } catch {
      if (!controller.signal.aborted)
        setError(
          "ESCO jest teraz niedostępne. Spróbuj ponownie. Możesz też uzupełnić ofertę samodzielnie.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const skills = [
    ...new Map(
      [
        ...(available && available.uri === value?.uri ? available.skills : []),
        ...(value?.skills ?? []),
      ].map((skill) => [skill.uri, skill]),
    ).values(),
  ];
  return (
    <section className="prototype-panel space-y-4" aria-labelledby="esco-heading" aria-busy={busy}>
      <h2 id="esco-heading">Podpowiedzi zawodu z ESCO</h2>
      <p>Wybierz profil jako punkt wyjścia. Dopisz obowiązki, wymagania i warunki swojej firmy.</p>
      <label className="grid gap-2">
        Szukaj zawodu w ESCO
        <Input
          maxLength={200}
          value={query}
          onChange={(event) => {
            request.current?.abort();
            setBusy(false);
            setQuery(event.target.value);
            setResults(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (query.trim().length >= 3 && !busy) void load();
            }
          }}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        disabled={busy || query.trim().length < 3}
        onClick={() => void load()}
      >
        Szukaj profilu ESCO
      </Button>
      {busy && <p role="status">Pobieram dane ESCO…</p>}
      {error && <p role="alert">{error}</p>}
      {results && (
        <div className="space-y-3">
          {results.query !== query.trim() && (
            <p>
              Wyniki dla krótszej frazy: „{results.query}”. Sprawdź, czy profil odpowiada
              stanowisku.
            </p>
          )}
          {results.results.length ? (
            <ul className="space-y-2" aria-label="Profile ESCO">
              {results.results.map((item) => (
                <li key={item.uri}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void load(item.uri)}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status">
              Brak pasujących profili. Spróbuj krótszej nazwy, np. „product manager”, albo nazwy po
              polsku.
            </p>
          )}
        </div>
      )}
      {value && (
        <div className="space-y-4">
          <h3>{value.label}</h3>
          <p className="whitespace-pre-wrap">
            {value.description || "Ten profil nie zawiera opisu po polsku."}
          </p>
          <a className="underline break-all" href={value.uri} target="_blank" rel="noreferrer">
            Źródło: ESCO — {value.label}
          </a>
          <fieldset className="space-y-3">
            <legend>Wybierz umiejętności do oferty ({value.skills.length})</legend>
            {skills.length ? (
              skills.map((skill) => (
                <label className="flex items-start gap-3" key={skill.uri}>
                  <Checkbox
                    checked={value.skills.some((item) => item.uri === skill.uri)}
                    onCheckedChange={(checked) => {
                      onChange({
                        ...value,
                        skills: checked
                          ? [...value.skills, skill]
                          : value.skills.filter((item) => item.uri !== skill.uri),
                      });
                      setNotice("");
                    }}
                  />
                  <span>
                    {skill.label} {skill.essential ? "(podstawowa w ESCO)" : "(dodatkowa w ESCO)"}
                  </span>
                </label>
              ))
            ) : (
              <p>
                Brak wybranych umiejętności.{" "}
                {available
                  ? "Profil nie zawiera podpowiedzi."
                  : "Pobierz profil ponownie, aby zobaczyć pozostałe propozycje."}
              </p>
            )}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void load(value.uri)}
            >
              Pobierz profil ponownie
            </Button>
            <Button
              type="button"
              disabled={busy || Boolean(notice)}
              onClick={() => {
                const added = onAppend(
                  [
                    `Profil zawodu: ${value.label}`,
                    value.description,
                    value.skills.length
                      ? `Wybrane umiejętności:\n${value.skills.map((skill) => `• ${skill.label}`).join("\n")}`
                      : "",
                    "Źródło: ESCO",
                  ]
                    .filter(Boolean)
                    .join("\n\n"),
                );
                if (!added) {
                  setError(
                    "Opis przekroczyłby 12 000 znaków. Skróć go przed dodaniem danych ESCO.",
                  );
                  return;
                }
                setNotice(
                  "Dodano do opisu. Uzupełnij treść o własne obowiązki, wymagania i warunki pracy.",
                );
              }}
            >
              Dodaj do opisu oferty
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                onChange(undefined);
                setAvailable(undefined);
                setNotice("");
              }}
            >
              Odłącz profil ESCO
            </Button>
          </div>
          <p>Odłączenie profilu zachowuje tekst już dodany do opisu.</p>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
