# Architecture

Layered architecture: **domain**, **application**, **infrastructure**. Each component below has a
fixed role, a layer it lives in, and a rule for what it must never do. Placement follows role, not
convenience — code goes where its role belongs, not where it's easiest to reach from.

## Layers

- **Domain** — business concepts and rules. No dependency on application or infrastructure.
- **Application** — orchestrates one action at a time (a use case) and the logic shared across
  actions. May depend on domain. Depends on infrastructure only through a contract it declares.
- **Infrastructure** — everything that talks to the outside world: HTTP, persistence, jobs, events.
  Depends on domain and application; implements application's contracts.

Dependencies point inward (infrastructure → application → domain), never outward.

## Dependency rule and coupling

Inverting a dependency — application declares a contract, infrastructure implements it, a factory
injects the implementation — is the preferred shape. A module may skip it when a contract would
buy nothing.

Skipping inversion does not mean skipping injection: a dependency may be a concrete class, but it
still arrives through the constructor, wired by a factory, substitutable in tests. Nothing
constructs its own collaborators.

**Rule that never bends, contract or not:** no persistence-specific type (a query filter, a driver
type, a stored-record shape) may appear in an application or domain signature. The dependency may
be concrete; the vocabulary exposed to callers must still be the module's own. This is the check to
run at review time — read signatures, not imports.

## The four data shapes

Every placement mistake is usually a shape mistake mapped to the wrong layer.

- **Stored record** — how a backend stores one record. Infrastructure only, never crosses out.
- **Domain object** — data plus behavior, backend-agnostic. Crosses into application.
- **Read model** — a flat projection for a consumer that will not mutate anything. Shared by
  directories and query services; declared alongside the contract that returns it.
- **Wire contract** — what an API endpoint actually returns to a client. Shared with the front end.
  Independent of the read model: a read model changes freely with internal needs, a wire contract
  cannot change without breaking a client.

A component that converts stored record ↔ domain object never carries business rules. A controller
never returns a read model straight to a client — it maps onto the wire contract.

## The three read paths

All three return data for a reader, and only differ by consumer:

| Path              | Consumer                                    | Returns        | Purpose                                     |
| ----------------- | -------------------------------------------- | -------------- | -------------------------------------------- |
| **DataSource**    | a use case mutating state                    | domain objects | serve one object's lifecycle                 |
| **Directory**     | use cases, application services, middleware  | read models    | expose what a module knows to other modules  |
| **Query service** | controllers                                  | read models    | feed a screen                                |

The discriminator is **who consumes the result**, not the shape returned — a directory and a query
service can return the same read model through near-identical methods.

**Rule:** a controller never reads through a directory, and internal code never reads through a
query service. Where the two overlap, the duplication is intentional — it stops a change made for
one consumer from rippling into the other. Do not merge them to remove the duplication. There is no
standing exception to this rule; if you find code that predates it, treat that as debt, not
precedent.

## Components

### Domain layer

Domain models, domain events, domain errors, types, enums, constants — nothing else. No domain
services: behavior lives on the model, and logic shared across use cases lives in an application
service.

- **Domain model** — the business concept, with its rules attached. Holds data and behavior
  together, enforces its own invariants, refuses to exist in an invalid state. Must not know about
  persistence, HTTP, or the current request. A rich model is the default; a module with no
  invariants worth enforcing may use a thinner type instead.
- **Domain event** — a statement that something business-meaningful happened, named in the past
  tense, carrying the minimum payload a listener needs. Must only be raised inside a transaction.

### Application layer

Use cases and application services, plus — where a module declares them — the contracts they
depend on and the read models those contracts speak in.

- **Use case** — the entry point for one complete application action; reading it should tell the
  whole story of that action. Validates its own input, controls the execution flow, owns the
  transaction, enforces invariants spanning more than one object, and dispatches work too expensive
  to do inline. Must not call another use case (extract the shared part into an application
  service instead) and must not know about HTTP. Always needed, contract or not — without a
  contract it may depend on infrastructure concretely.
- **Application service** — reusable application logic, agnostic of the transaction; joins whatever
  transaction its caller opened rather than managing one. Must not become a home for logic that
  belongs on a domain model. Needed once two or more use cases need the same behavior, not before.
- **Job** — a use case triggered by a schedule or a queue instead of a user request; same rules as
  a use case.
- **Contract** — the interface infrastructure must satisfy to be injected into application code,
  declared in the application's own vocabulary. Must not mention a backend or a driver type.
  Preferred wherever a module can justify one; a module with nothing worth abstracting over may
  skip contracts by design.
- **Read model** — a flat projection describing exactly what its consumers need, declared alongside
  the contract that returns it.

### Infrastructure layer

Adapters in both directions: driving (controllers, middleware, job handlers, listeners) and driven
(persistence, directories, query services, outbound clients). Persistence components for one module
and one backend live together, so that backend-specific query language never leaves that location.

- **DAO** — the component closest to the store; the seam where a guard is imposed on every read and
  write at once, so safety is the default for code not yet written. Must not know a read model, a
  domain object, or why a caller wants the data. Every module gets one. A DAO may additionally
  expose a narrowed, named read vocabulary in place of a fully generic query interface — worth
  adding only when there is a real guard to express.
- **DataSource** — persistence for one domain object's lifecycle: load it, save it, delete it,
  speaking only in domain objects. Must not carry query-service-shaped methods (no listing, no
  projections, no reporting) and must not leak persistence shapes outward.
- **Directory** — a module's read-facing contract for *other modules* — the way a cross-cutting
  concern exposes what it knows internally. Returns read models. Must not be used to populate a UI.
- **Query service** — the read projection that feeds a screen, returning read models. Must not be
  called by a use case, application service, or middleware, and must not return domain objects.
- **Mapper** — translates a stored record into a domain object and back. Must not contain business
  rules.
- **Controller** — a driving adapter: turns a request into a use case call and its result into a
  response, mapping domain errors to status codes. Must not contain business logic, and must not
  touch a DataSource or DAO directly.
- **Middleware** — cross-cutting request concerns: authentication, context setup, logging.
- **Job handler** — the async counterpart to a controller: turns a queued job into a use case call.
- **Listener** — reacts to one domain event; registered so it runs automatically once wired at
  startup.
- **Factory** — builds a component with its dependencies wired. The only place request/tenant
  context may be reached for directly; every other layer receives it through the constructor.
