# V1 (legacy)

Modules still substantially V1 include `services/`, `suggestions/`, `sync/`, `settings/`,
`activitylog/`, `updatelogs/`, `preserve/`, `relationships/` and `auth/`.

**How to recognise it.** It imports from `#api/odm`, exports a bare object literal of async
functions, reaches for its dependencies at module scope instead of receiving them, and has no
factory. There are no layers: a single module holds the HTTP shape, the business rule and the
Mongo query.

**Do not opportunistically refactor.** Fix what the task needs and leave the rest. V1 lacks the
seams that make refactoring safe here — behaviour depends on ambient state and module-scope
singletons, so a change that looks local frequently is not. A tidy-up bundled into a feature branch
is the most expensive kind of change to review and to revert.

## Known traps

These are the things that make V1 behave differently from what the code in front of you appears to
say. Each one has bitten before.

### Ambient user, not a parameter

`permissionsContext.getUserInContext()` reads the user from `appContext` — AsyncLocalStorage. No
function signature mentions it. Consequences:

- **`ModelWithPermissions` silently filters query results by the ambient user.** The same query, with
  the same arguments, returns different documents depending on who is in context. If nothing is in
  context, it returns something different again.
- **`needsPermissionCheck()` returns `false` for admin and editor.** Both roles bypass filtering
  entirely, so exercising a change only as an admin proves nothing about permissions. Test with a
  collaborator.
- **`setCommandContext()` installs a fake `commandId` editor**, used by scripts, migrations and CLI
  entry points. It is a deliberate bypass. If you call V1 code from a new entry point, decide
  consciously whether it runs as a real user or as the command user — the default is whatever the
  caller happened to leave in context.

When calling V1 code from V2, the actor in `ExecutionContext` and the user in `appContext` are two
different mechanisms. Do not assume setting one sets the other.

### Ambient tenant

`tenants.current()` reads the tenant from `appContext` and **throws** if the current async context
has none — `There is no tenant on the current async context`. The failure mode is not a wrong
tenant, it is a runtime error appearing only on the paths that escaped the context: work started
inside a job, a worker, an event listener, a timer, or any promise not awaited within the request's
async scope.

Never cache anything derived from `tenants.current()` at module scope. In a multi-tenant process the
first request would populate it for everyone else.

### `eventBus` runs listeners in-band

`core/libs/eventsbus/EventsBus.ts` awaits every listener inside `emit`. It is the V1 synchronous
system, and it is still in use. So:

- a listener that throws fails the caller;
- a slow listener slows the request that emitted the event;
- there is no transactional guarantee and no retry.

New work uses the V2 `AsyncEventEmitter`, which dispatches listeners as jobs and must be emitted
inside a transaction. The two systems coexist; do not add listeners to `eventBus`.

### Sequential batch updates

V1 batch operations issue one update per record in a loop. What reads as a single operation is N
round trips, and the cost is invisible until the collection is large. Assume any V1 "update many"
path is doing this, and check before adding to it.

### No dependency injection

Collaborators are imported at module scope, not received. There is nothing to substitute, so V1
tests mock modules — which is why they are brittle and why adding a dependency to a V1 module tends
to break unrelated specs.

## Bridging to V2

Two patterns, in order of preference.

**1. Move the caller.** Prefer updating the calling code to use V2 directly. This is the only one
that reduces the amount of V1.

**2. Facade over V2.** Keep the legacy entrypoint's signature and delegate to V2 behind it, so
existing callers do not change. `app/api/entities/entities.ts` is the worked example — it still
looks like the old `entities` module to its callers, but the implementation is the V2
`EntitiesDAOFactory`. Note how the facade makes the permission decision **explicit** in the API
(`get` enforces, `getUnrestricted` does not) rather than leaving it to ambient state. Do that: when
you wrap V1 behaviour, promote its hidden decisions into the signature.

`app/api/core/v1_layer/` holds façades for legacy entrypoints (`v1_layer/thesauri/`,
`v1_layer/templates/`) that other modules still import. Add one only when a legacy module genuinely
still needs the old entrypoint.

## When you do have to change V1

- Keep the change as local as the task allows.
- Write a test that pins the current behaviour before changing it, if none exists. V1's ambient
  state means you often cannot tell what the behaviour is by reading.
- Test as a non-privileged user, or the permission path is not exercised at all.
- If the change is growing into a refactor, stop and ask. That is a decision about migration
  sequencing, not a detail of the task.
