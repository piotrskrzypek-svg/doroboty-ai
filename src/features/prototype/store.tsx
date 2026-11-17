import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { curatedJobId, initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, STORAGE_KEY, type StoragePort } from "./storage";
import {
  requestedShortlistVariant,
  shortlistVariant,
  SHORTLIST_TEST_MODE_KEY,
  SHORTLIST_VARIANT_KEY,
  type ShortlistVariant,
} from "./shortlist-variant";

function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function browserSessionStorage(): StoragePort | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function storedValue(storage: StoragePort | null, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function preparedTestState(): State {
  const state = initialState();
  state.activePersonId = "employer-brightlabs";
  return state;
}

function usableTestState(state: State) {
  return (
    state.people.some((person) => person.id === "employer-brightlabs") &&
    state.jobs.some((job) => job.id === curatedJobId) &&
    ["application-example", "application-candidate-julia", "application-candidate-pawel"].every(
      (id) =>
        state.applications.some(
          (application) => application.id === id && application.jobId === curatedJobId,
        ),
    )
  );
}

function saveTestSession(storage: StoragePort | null, variant: ShortlistVariant, state: State) {
  try {
    storage?.setItem(SHORTLIST_TEST_MODE_KEY, variant);
    storage?.setItem(SHORTLIST_VARIANT_KEY, variant);
    saveState(storage, state);
  } catch {
    // The test view can still run in memory when session storage is unavailable.
  }
}

function initialLoad() {
  const storage = browserSessionStorage();
  const requested = requestedShortlistVariant(window.location.hash);
  const previous = shortlistVariant(storedValue(storage, SHORTLIST_TEST_MODE_KEY));
  const mode = requested ?? previous;
  if (!mode) return { mode: null, loaded: readState(browserStorage()) };

  let state = preparedTestState();
  if (!requested || requested === previous) {
    const raw = storedValue(storage, STORAGE_KEY);
    if (raw) {
      try {
        const saved = parseState(raw);
        if (usableTestState(saved)) state = saved;
      } catch {
        // An invalid test-only save is replaced by the prepared scenario.
      }
    }
  }
  state.activePersonId = "employer-brightlabs";
  saveTestSession(storage, mode, state);
  return { mode, loaded: { state, issue: "", blocked: false, original: null } };
}

function useStore() {
  const [initial] = useState(initialLoad);
  const mode = useRef(initial.mode);
  const [state, setState] = useState(initial.loaded.state);
  const [issue, setIssue] = useState(initial.loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(initial.loaded.blocked);
  const latest = useRef(state);
  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return;
    try {
      saveState(mode.current ? browserSessionStorage() : browserStorage(), next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    try {
      commit(transition(latest.current, action));
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    function enterRequestedTestSession() {
      const requested = requestedShortlistVariant(window.location.hash);
      if (!requested || requested === mode.current) return;
      const next = preparedTestState();
      mode.current = requested;
      latest.current = next;
      setState(next);
      setIssue("");
      setError("");
      setBlocked(false);
      saveTestSession(browserSessionStorage(), requested, next);
    }
    window.addEventListener("hashchange", enterRequestedTestSession);
    return () => window.removeEventListener("hashchange", enterRequestedTestSession);
  }, []);
  return {
    state,
    testVariant: mode.current,
    issue,
    error,
    blocked,
    original: initial.loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => commit(mode.current ? preparedTestState() : initialState(), true),
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
