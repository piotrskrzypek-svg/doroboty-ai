import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyAccountAccess } from "./access";
import { cloudClient } from "./client";
import { useCloudSession } from "./session";
import { accessRoleLabels, type AccessRole } from "./roles";

export function AccountPanel({ role, onEnter }: { role: AccessRole; onEnter: () => void }) {
  const session = useCloudSession();
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const signup = registering && role === "candidate";
  async function enter(userId: string) {
    if (!cloudClient) return;
    await verifyAccountAccess(cloudClient, userId, role);
    onEnter();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cloudClient || busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    setError("");
    setNotice("");
    if (signup && password !== String(form.get("confirmation"))) {
      setError("Hasła muszą być takie same.");
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const result = await cloudClient.auth.signUp({ email, password });
        if (result.error)
          throw new Error("Nie udało się utworzyć konta. Sprawdź dane lub spróbuj później.");
        if (result.data.session) await enter(result.data.session.user.id);
        else {
          setRegistering(false);
          setNotice(
            "Potwierdź adres linkiem w e-mailu. Następnie wróć na ten ekran i zaloguj się jako kandydat.",
          );
        }
      } else {
        const result = await cloudClient.auth.signInWithPassword({ email, password });
        if (result.error || !result.data.user)
          throw new Error(
            "Logowanie nie powiodło się. Sprawdź dane i potwierdzenie adresu e-mail.",
          );
        await enter(result.data.user.id);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Nie udało się połączyć. Spróbuj ponownie.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="prototype-panel space-y-4" aria-labelledby="account-heading">
      <h2 id="account-heading">Własne konto — {accessRoleLabels[role]}</h2>
      <p>Logowanie e-mailem i hasłem. Dane konta są zapisywane w bazie.</p>
      {role !== "candidate" && (
        <p>
          Rekruter i hiring manager korzystają z dostępu pracodawcy. Konto musi mieć włączone
          uprawnienia firmy.
        </p>
      )}
      {!cloudClient ? (
        <p role="status">
          W tym podglądzie własne konta są niedostępne. Możesz skorzystać z gotowych osób poniżej.
        </p>
      ) : session === undefined ? (
        <p role="status">Sprawdzam logowanie…</p>
      ) : session ? (
        <div className="space-y-3">
          <p>Zalogowano: {session.user.email}</p>
          <Button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await enter(session.user.id);
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : "Nie udało się sprawdzić dostępu.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Kontynuuj jako {accessRoleLabels[role]}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const service = cloudClient;
                if (!service) return;
                const result = await service.auth.signOut({ scope: "local" });
                if (result.error) throw result.error;
                setError("");
              } catch {
                setError("Nie udało się wylogować.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Zaloguj się innym kontem
          </Button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <fieldset disabled={busy} className="grid min-w-0 gap-4">
            <label className="field">
              <span>E-mail</span>
              <Input name="email" type="email" autoComplete="username" required />
            </label>
            <label className="field">
              <span>Hasło</span>
              <Input
                name="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 8 : undefined}
                required
              />
            </label>
            {signup && (
              <label className="field">
                <span>Powtórz hasło (co najmniej 8 znaków)</span>
                <Input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                {busy
                  ? "Proszę czekać…"
                  : signup
                    ? "Utwórz konto kandydata"
                    : `Zaloguj się jako ${accessRoleLabels[role]}`}
              </Button>
              {role === "candidate" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRegistering((value) => !value);
                    setError("");
                    setNotice("");
                  }}
                >
                  {signup ? "Mam już konto" : "Nowy kandydat — utwórz konto"}
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
