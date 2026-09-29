# V1 (legacy)

**Read this when:** you are about to change a V1 module — anything in `app/api` outside `core/` and
`*.v2/`.

V1 is on its way out. This document is not a description of it; it is the set of tips that keep a
change to it from going wrong.

**How to recognise it.** No layers and no factory: one module holds the HTTP shape, the business
rule and the Mongo query, exports a bare object of async functions, and reaches for its
collaborators at module scope instead of receiving them.

## Tips

**Do not opportunistically refactor.** Fix what the task needs and leave the rest. V1 lacks the seams
that make refactoring safe — behaviour depends on ambient state and module-scope singletons, so a
change that looks local frequently is not. A tidy-up bundled into a feature branch is the most
expensive kind of change to review and to revert.

**Assume the user is ambient, not a parameter.** V1 reads the acting user from async-local storage,
so no signature mentions it. That means the same query with the same arguments returns different
documents depending on who is in context — and admins and editors bypass permission filtering
entirely, so exercising a change as an admin proves nothing. **Test as a collaborator**, or the
permission path is never exercised.

**Scripts and migrations run as a fake command user.** That bypass is deliberate. If you call V1 code
from a new entry point, decide consciously whether it runs as a real user or as the command user —
the default is whatever the caller happened to leave in context.

**The V2 actor and the V1 ambient user are two different mechanisms.** Setting one does not set the
other. Crossing from V2 into V1 means establishing the V1 context explicitly.

**The tenant is ambient too, and its absence throws.** The failure mode is not a wrong tenant but a
runtime error, appearing only on paths that escaped the request's async scope: work started inside a
job, a worker, an event listener, a timer, or a promise nobody awaited. And never cache anything
derived from the current tenant at module scope — in a multi-tenant process the first request would
populate it for everyone else.

**The V1 event bus runs listeners in-band.** It awaits every listener inside `emit`, so a listener
that throws fails the caller, a slow one slows the emitting request, and there is no transactional
guarantee and no retry. New work uses the V2 async emitter, which dispatches listeners as jobs
inside a transaction. **Do not add listeners to the V1 bus.**

**Batch updates are sequential.** A V1 "update many" path issues one update per record in a loop.
What reads as a single operation is N round trips, invisible until the collection is large. Check
before adding to one.

**There is nothing to inject, so V1 tests mock modules.** That is why they are brittle, and why
adding a dependency to a V1 module tends to break specs that look unrelated.

## Bridging to V2

**Prefer moving the caller.** Updating the calling code to use V2 directly is the only option that
reduces the amount of V1.

**Otherwise, put a facade over V2.** Keep the legacy entrypoint's signature and delegate to V2
behind it, so existing callers do not change. When you do, **promote the hidden decisions into the
signature** — the worked example in `app/api/entities/entities.ts` splits permission enforcement
into two explicit operations rather than leaving it to ambient state. Facades that other modules
still import live under `app/api/core/v1_layer/`; add one only when a legacy module genuinely still
needs the old entrypoint.

## When you do have to change V1

- Keep the change as local as the task allows.
- If no test pins the current behaviour, write one before changing it. V1's ambient state means you
  often cannot tell what the behaviour is by reading.
- Test as a non-privileged user.
- If the change is growing into a refactor, stop and ask. That is a decision about migration
  sequencing, not a detail of the task.
