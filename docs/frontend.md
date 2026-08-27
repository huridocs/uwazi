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
