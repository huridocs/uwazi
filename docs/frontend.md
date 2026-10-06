# Frontend

The frontend is a React single-page application, server-side rendered by the Express backend. Mid-migration: V1 (Redux, `api`) → V2 (Jotai, `apiClient`).

## Tech Stack

Frontend is in `app/react`

- React (with JSX)
- Redux (actions/reducers pattern) — legacy, deprecated
- Jotai — V2 state (atoms)
- Tailwind CSS
- Webpack (development server via `webpack-server`)
- Storybook for component development

## Architecture

- **SSR:** `app/react/entry-server.tsx` renders React on the server (`ReactDOMServer` + react-router `createStaticHandler`); `app/react/entry-client.tsx` hydrates on the client (`hydrateRoot` + `createBrowserRouter`).
- **Monolith:** the SSR entry imports backend modules directly (`templatesApi`, `thesauriApi`, `ExecutionContext`, `tenants`) — frontend and backend run in the same Express process.
- **Two state systems coexist:** Redux (legacy, deprecated) + Jotai (V2), kept in sync via `V2/atoms/syncReduxFromAtoms.js`. Target Jotai for new work.
- **Two API clients:** `api` (`#app/utils/api.js`, legacy) + `apiClient` (`#V2/api/client.js`, V2). Target `apiClient` for new work.

## System UI translations

System chrome (`<Translate>`, `t('System', key, fallback, false)`) is **not** entity/template/thesaurus copy. Entity titles and template labels use a separate translation system — do not wrap those.

Locale CSVs in `contents/ui-translations/` are the source of truth for System UI strings. Adding a key copies the English string into every locale; it does **not** translate it.

`contents/translation-context.csv` is the translator brief (not the runtime `context` of `System` / `Entity` / `Thesaurus`):

| Column           | Meaning                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Key`            | i18n key (English source string)                                                                                                                            |
| `Component`      | UI role. For **new** rows use: `UI text`, `Button label`, `Toast notification`, `Accessible label`, `Placeholder`, `Tooltip`, `Field label`, `Option label` |
| `View`           | Screen (`Settings > Account`, `Library`, `Entity view`). `Unresolved` if unknown                                                                            |
| `Context`        | One line: what the user sees and what the control does                                                                                                      |
| `DoNotTranslate` | `true` only for brands, file-format tokens, and search-query examples that must stay English (`Uwazi`, `PDF`, `198?`)                                       |

Do not overwrite an existing context row. Do not overwrite a locale value that is already not English.

### Every PR that touches UI copy

1. `yarn check-translations` — missing `Translate` / `t()`, unwrapped JSX, attributes, notify, labels, composed strings.
2. `yarn check-translations --fix` if the leftovers are wrap-able (JSX text, native attributes, `notify()`). Option-label maps and composed strings stay manual.
   Composed leftovers (`Page ${n}`, `Delete ${name}`): translate the static word and concatenate the dynamic value. Reuse an existing key when that word already exists (`Page`, `Delete`). Do **not** invent keys like `Page {n}` and then `.replace('{n}', …)` — `t()` does not interpolate, so a translator who drops `{n}` silently breaks the UI. Same for `{name}`.
3. `yarn update-translations-csv` — inserts new keys into every locale CSV **and** appends context stubs. `--dry` first if unsure. Do not `--prune` unless you have checked the unused list.
4. Edit the new rows in `contents/translation-context.csv`: replace the stub `Context` with a real one-line meaning; fix `Component` / `View` if the guess is wrong; set `DoNotTranslate=true` when the key must stay English.
5. `yarn check-untranslated-csv --only-new` — keys still English in **every** locale, minus the keep-English allowlist. `--limit=20` to take a small batch. `--locales=es,fr` to restrict. Exit code 1 means there is still work.
6. Fill those locale values yourself (use the context row as the brief). Preserve punctuation and markdown. Never invent keys; never translate `DoNotTranslate` / brand / query-syntax rows. Do not add `{n}` / `{name}` placeholders to new keys.
7. Leave the CSV and context diffs in the same PR as the feature.

CI runs `yarn check-translations` only (wrapping + missing keys). It does **not** fail on English leftovers in `es.csv`. Untranslated locale values are the agent's last step, not a merge gate.
