# SSR API client

A typed client that server-side rendering uses to read from the API **without an HTTP round
trip**. Each method calls the same controller that serves the matching `GET /api/...` route,
in-process, as the user of the page being rendered, and returns exactly what that route would
have sent: same body, same JSON shape, same errors.

## Getting a client

Create one client per page request, in server-only code:

```ts
import { createServerApiClient } from '#api-client/server';
import { ServerApiError } from '#api-client';

const api = createServerApiClient(req); // req: the Express request being rendered

const { rows: templates } = await api.templates.getAll();
const settings = await api.settings.get();
```

- Every call acts as `req.user`, in `req.language`, and sees the request's headers and cookies.
- The client must be used inside the request's handling (the SSR route): it needs the request's
  execution context and throws if there is none.
- Calls can run in parallel. Each one gets its own context and transaction.

## Server-only

`#api-client/server` contains the server implementation. It must never reach a browser bundle:

- Webpack resolves it to a stub that throws on import, and the module itself throws if it is
  loaded where `window` exists.
- Lint allows value imports of `#api-client/server` only in `app/react/server.ts`,
  `app/react/entry-server.tsx` and `app/react/V2/services/server/**`.
- `#api-client` (types and `ServerApiError`) and `import type` from either entry are safe anywhere.

## Resources

| Resource              | Method                             | Same as                                          | Who can call                 |
| --------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------- |
| `settings`            | `get()`                            | `GET /api/settings`                              | anyone (admins see more)     |
|                       | `getLinks()`                       | `GET /api/settings/links`                        | anyone                       |
| `templates`           | `getAll()`                         | `GET /api/templates`                             | anyone                       |
| `thesauri`            | `getAll({ _id? })`                 | `GET /api/dictionaries`                          | anyone                       |
| `relationshipTypes`   | `getAll()`                         | `GET /api/relationtypes`                         | anyone                       |
| `translations`        | `getLegacy({ context?, locale? })` | `GET /api/translations`                          | anyone                       |
|                       | `getEntries()`                     | `GET /api/v2/translations`                       | anyone                       |
| `users`               | `getAll()`                         | `GET /api/users`                                 | admins                       |
|                       | `getCurrent()`                     | `GET /api/user`                                  | anyone (`{}` if anonymous)   |
| `userGroups`          | `getAll()`                         | `GET /api/usergroups`                            | admins                       |
| `entities`            | `get(query)`                       | `GET /api/entities`                              | anyone (permission-filtered) |
| `relationships`       | `getSummary({ sharedId })`         | `GET /api/relationships/summary`                 | anyone (permission-filtered) |
|                       | `getAnchors({ sharedId, file })`   | `GET /api/relationships/anchors`                 | anyone (permission-filtered) |
| `pages`               | `list({ sharedId? })`              | `GET /api/pages`                                 | anyone                       |
|                       | `get({ sharedId, mode? })`         | `GET /api/page`                                  | anyone                       |
| `dataviz`             | `list()`                           | `GET /api/dataviz`                               | admins                       |
|                       | `getById(id)`                      | `GET /api/dataviz/:id`                           | admins                       |
| `paragraphExtraction` | `getExtractors()`                  | `GET /api/paragraphExtraction/extractors`        | admins, editors; flag on     |
|                       | `getExtractorStatuses(query)`      | `GET /api/paragraphExtraction/extractorStatuses` | admins, editors; flag on     |
|                       | `getEntityParagraphs(query)`       | `GET /api/paragraphExtraction/entityParagraphs`  | admins, editors; flag on     |
| `activityLog`         | `list(query?)`                     | `GET /api/activitylog`                           | admins                       |

Queries take **typed** values (numbers, booleans, arrays, nested objects). Do not JSON-encode them
the way the browser client does for `/api/entities` and `/api/activitylog`: there is no query
string to decode.

Response types are exported from `#api-client` (for example `TemplatesResponse`,
`EntitiesResponse`, `ActivityLogResponse`). They describe the JSON that is returned: ids and dates
come back as strings, exactly as over HTTP.

## Errors

A method resolves with the response body, or rejects in one of two ways.

**The route answered with an error status** → `ServerApiError`:

```ts
try {
  const users = await api.users.getAll();
} catch (error) {
  if (error instanceof ServerApiError && error.status === 401) {
    // not allowed: render without the list
  }
  throw error;
}
```

| Field     | What it holds                                            |
| --------- | -------------------------------------------------------- |
| `status`  | The HTTP status the route answered with (401, 403, 404…) |
| `message` | The route's `error` or `message` text                    |
| `body`    | The error body the route sent, when there is one         |

Statuses to expect:

- **401** — the user may not call this resource, or the instance is private and nobody is logged
  in (the same rule `PrivateInstanceMiddleware` applies to `/api/*`).
- **403** — the feature behind the resource is off for this tenant (paragraph extraction).
- **404** — the thing asked for does not exist. `entities.get` rejects with 404 (body
  `{ rows: [] }`) for an entity that is missing or not readable by the user.

**The controller threw** → the thrown error, untouched. This covers an invalid query (the
validation error the error middleware would answer 400 or 422 for) and anything that failed on
the server. It is not logged here: let it propagate and the server side render error handling
logs it and answers with its status, as `errorHandlingMiddleware` does for `/api/*`.

A controller that tried to redirect, stream or set a cookie rejects with
`UnsupportedInSsrClientError` instead. That is a bug in how the resource was wired, not something
to handle at the call site.

## Out of scope

Only read endpoints built on `AbstractController` are covered. These are not in the client:

- V1 route handlers that are plain closures, such as `/api/thesauris`, `/api/references/*` and the
  legacy relationships routes
- `/api/v2/search` and `/api/search`
- files and uploads
- `/api/languages`
- information extraction (IX)
- stats
- every mutating endpoint (POST, PUT, DELETE)

Keep using the existing HTTP services for those.
