# Employer shortlist — test scenario and dry run

## Purpose

Observe whether an employer can decide whom to invite to a first conversation using the manual shortlist while retaining access to every application. This is a usability scenario with synthetic data. A participant's behavior, time spent, questions and decision must be recorded separately from the agent dry run below.

## Setup for a participant

- App: `http://127.0.0.1:3001/#/app/kandydaci`.
- Persona: **Karolina Wiśniewska**, recruiter at **BrightLabs**.
- Job: **AI Product Manager**. The starting scenario has three submitted applications: Marek Nowak, Julia Mazur and Paweł Zieliński. Julia and Marek appear on the manual shortlist; Paweł remains in the full list.
- Use a fresh scenario state for each participant. If the browser already contains work, export it before using Settings → Reset, or use a separate browser profile. For an older save with only Marek, the shortlist offers **Dodaj przykładowe zgłoszenia**; this adds Julia and Paweł without replacing earlier decisions.
- The candidate materials and employer decisions remain in this browser. The **Zaproszenie na rozmowę** stage records a local decision; it does not send a message.

## Task to read to the participant

> Jesteś Karoliną z BrightLabs. Rekrutujesz na stanowisko AI Product Manager. Masz zgłoszenia kandydatów w aplikacji. Zdecyduj, kogo zaprosisz do pierwszej rozmowy, i zapisz tę decyzję. Pracuj tak, jak zwykle; mów na głos, z których informacji korzystasz i czego Ci brakuje.

Do not name a preferred candidate, point to the shortlist or explain the Match Score before the participant acts. Help only if a technical obstacle blocks the task; record any help given.

## Observation guide

1. Start on **Kandydaci** with the BrightLabs role selected. Record whether the participant notices the manual curation label and the difference between the shortlist and all applications.
2. Watch which shortlist cards and complete applications they open. Record whether the reasons and quoted application evidence help or mislead, and whether they inspect the full list and CV tabs.
3. Ask them to record their choice through **W przeglądzie → Zaproszenie na rozmowę**. Observe whether the two-step stage flow is understood without coaching. The participant may choose any candidate.
4. Confirm the saved stage and note in the history after reload. Record any missing information, confusion, errors and recovery.
5. Ask: „Co przesądziło o wyborze?”, „Które uzasadnienie było przydatne lub niewiarygodne?”, „Czego zabrakło przed zaproszeniem?” and „Jak rozumiesz sposób przygotowania tej listy?”.

Record the participant's chosen candidate, opened materials, stage completed, help required, notable quotes and observed friction. Leave these fields empty until a person actually takes the test. A successful click or a positive opinion alone does not show time saved, better candidate quality or repeat purchase.

## Agent dry run — 16 November 2026

**Setup observed:** Karolina was selected; the AI Product Manager role showed three synthetic applications and two manual shortlist cards.

**Path completed:** I opened Marek's application and CV, returned to the list, opened Paweł's application from the full list, then opened Julia's application and CV. I chose Julia for the scripted decision because her example directly described a pilot in a finance workflow, matching the role context. I saved a note while moving her application to **W przeglądzie**, then saved a second note while moving it to **Zaproszenie na rozmowę**. After reload, the stage and both notes were present in the history. The browser now holds this completed local scenario for Julia; prepare a fresh state before an unassisted participant test.

**Result boundary:** This was an agent walkthrough of navigation and persistence, not an observation of an employer. No actual invitation was sent and there is no evidence yet that the shortlist improves decisions or reduces screening time.

## Prepared AI content disclosure

Julia's and Paweł's synthetic profiles and application answers, the two shortlist reasons, evidence selections, follow-up questions and the dry-run notes were authored with the assistance of this AI agent for the prototype. Marek's prepared example was already in the repository. The app's job-description AI control was not used during this walkthrough. The shortlist is a fixed, manually curated scenario fixture; Match Scores are fixed scenario values and do not verify competence. Do not present these prepared texts or the agent's choice as participant responses or research results.
