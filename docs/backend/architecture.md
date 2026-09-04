# Architecture

Adding code here is mostly translation: take the business requirement, express it as one or more
**use cases**, break each use case into **components**, and put each component in its **layer**. The
structure is already decided — the design work that remains is in the domain, not the plumbing. This
document gives you the vocabulary to translate into.

## How to add code

1. **Name the use case.** One complete application action, phrased the way the business phrases it
   (`CreateUser`, `DeleteTemplate`, `GrantEntityPermissions`).
2. **Find the module and read its tier.** The module you are editing already has a shape. Match it.
   Do not promote or demote a module as a side effect of a feature.
3. **Pick the components** the use case needs, from the catalogue below.
4. **Place each one in its layer**, in the folder its module already uses.
5. **Wire it in a factory.** Everything is constructor-injected; nothing reaches for its own
   dependencies.
6. **Write the tests** — see `testing.md`.

**When a component's stated shape does not fit the task, stop and ask.** Do not deviate silently and
do not invent a new kind of component. Raising it is cheap; a shape nobody agreed to is not.

## Which component do I need?

| I need to…                                                   | Component                    | Layer                             |
| ------------------------------------------------------------ | ---------------------------- | --------------------------------- |
| perform a complete business action                           | **Use case**                 | application                       |
| reuse logic across use cases, without owning the transaction | **Application service**      | application                       |
| hold a business rule, invariant or state transition          | **Domain model**             | domain                            |
| announce that something happened                             | **Domain event**             | domain                            |
| load or save a domain object for its lifecycle               | **DataSource**               | infrastructure                    |
| put a guard on every read/write of a collection              | **DAO**                      | infrastructure                    |
| let another module read what mine knows                      | **Directory** (+ read model) | infra impl / application contract |
| feed a screen                                                | **Query service**            | infrastructure                    |
| turn a stored row into a domain object                       | **Mapper**                   | infrastructure                    |
| accept and answer an HTTP request                            | **Controller**               | infrastructure                    |
| run work outside the request                                 | **Job** (+ **job handler**)  | application / infrastructure      |
| react to a domain event                                      | **Listener**                 | infrastructure                    |
| wire dependencies                                            | **Factory**                  | infrastructure                    |

The three rows most often confused are **DataSource**, **Directory** and **Query service**. They are
all reads. See _The three read paths_.

## Module tiers

There is no single amount of ceremony that suits every module. Each module sits in one of two tiers.

**Full DDD** — `template`, `entity` + `entityAccessPolicy`, `user` + `userGroup`. Rich domain models
carrying data and behavior, invariants enforced in the domain, contracts in `application/contracts`
with implementations injected against the interface. These are the modules to copy from.

**Pragmatic** — everything else in `core`. Still use cases, so the architecture still screams what
the application does. But the model may be built on top of the persistence shape, there are **no
contracts**, and a use case may depend on a DAO or DataSource concretely.

A module belongs in full DDD when it has invariants spanning more than one field or entity, state
transitions with rules about which are legal, or behavior beyond create/read/update/delete.
Otherwise it is pragmatic. **You will rarely make this call** — the module already has a tier, and
only a genuinely new module raises the question. When one does, ask.

## Dependency rule, and controlled coupling

The full-DDD tier inverts dependencies: the application layer declares a contract, infrastructure
implements it, the factory injects the implementation.

The pragmatic tier does not, and that is deliberate. **Coupling is not a problem when it is
controlled** — a concrete dependency is fine as long as the thing depended on is itself an
abstraction over the raw infrastructure. Skipping dependency _inversion_ never means skipping
dependency _injection_: dependencies still arrive through the constructor, typed as the concrete
class, wired by a factory, substitutable in tests. Nothing constructs its own collaborators.

What may never happen, in either tier:

> **Infrastructure shapes must not escape the component that owns them.** No Mongo filter or
> aggregation pipeline, no SQL string, no driver type, no DBO in any signature reaching application
> or domain code. The dependency may be concrete; the vocabulary must be the module's own.

That is the check to run at review time: read the signatures, not the imports.

## The four shapes

Placement mistakes are usually shape mistakes. There are four shapes and never fewer:

- **DBO** — how a record is stored, one per backend (`UserDBO`). Infrastructure only.
- **Domain object** — data plus behaviour, backend-agnostic (`User`). Crosses into application.
- **Read model** — a flat projection for consumers that will not mutate anything (`UserView`,
  `UserProfile`). Declared in `application/contracts`, shared by directories and query services.
- **Wire contract** — what an endpoint actually returns, in `app/shared/contracts/` (`Users.ts`),
  shared with the front end. A controller maps the read model onto it field by field.

The last two look alike and must stay separate: a read model is free to change with an internal
need, and a wire contract cannot change without breaking a client. **A controller never returns a
read model directly.**

A **mapper** converts DBO ↔ domain object. Read models are built by whoever reads them.

## The three read paths

|                   | Consumer                                    | Returns        | Purpose                                     |
| ----------------- | ------------------------------------------- | -------------- | ------------------------------------------- |
| **DataSource**    | a use case mutating state                   | domain objects | serve one object's lifecycle                |
| **Directory**     | use cases, application services, middleware | read models    | expose what a module knows to other modules |
| **Query service** | controllers                                 | read models    | feed the UI                                 |

The discriminator is **who consumes the result**, not what comes back — directories and query
services return the same read models, and their methods can look near-identical
(`UsersDirectory.list()` vs `UsersQueryService.listUsers()`).

> **A controller never touches a directory. Internal code reads through a directory, not a query
> service** — when internal code needs what a screen needs, the module exposes it on its directory.

Where the two overlap, the duplication is intentional: it stops a change made for a screen from
rippling into internal callers, and vice versa. Do not "clean it up" by merging them.

One pre-existing exception: `app/api/stats/services/RetrieveStatsService.ts` calls
`UsersQueryService.countByRole()` from internal code. It predates the rule — treat it as something
to unpick, not as precedent.

## Domain layer

Domain models, domain events, domain errors, types, enums and constants. Nothing else — in
particular there are no domain services here; behavior belongs on the model, and logic shared
across use cases belongs in an application service.

### Domain model

**Role.** The business concept, with its rules attached.

**Responsibilities.** Hold data and behavior together. Enforce invariants and validate state
changes. Refuse to exist in an invalid state.

**Must not.** Know about persistence, HTTP, or the current request. Import from `application/` or
`infrastructure/`.

**Needed when.** Always, in the full-DDD tier. In the pragmatic tier the model may be a thin type
built on the persistence shape.

**Example.** `domain/user/User.ts`, `domain/entityAccessPolicy/`.

### Domain event

**Role.** A statement that something business-meaningful happened.

**Responsibilities.** Name the fact in past tense and carry the minimum payload a listener needs.

**Must not.** Be emitted outside a transaction — `AsyncEventEmitter` throws.

**Example.** `domain/entity/EntityCreatedEvent.ts`.

## Application layer

Use cases and application services — plus, in the full-DDD tier, the contracts they depend on and
the read models those contracts speak in.

### Use case

**Role.** The entry point for one complete application action. Reading the file should tell the
whole story of that action.

**Responsibilities.** Validate input (zod schema, colocated in the file). Control the execution
flow. **Own the transaction** — wrap DB work in `this.transactionManager.run()`. Enforce invariants
that span more than one object. Dispatch jobs for work too expensive to do inline. Extend
`AbstractUseCase<Input, Output, Deps>` (`libs/UseCase.ts`), which supplies actor, tenant and shared
deps.

**Must not.** Call another use case — extract the shared part into an application service. Know
about HTTP. Build queries.

**Needed when.** Always, both tiers. The pragmatic tier keeps use cases so the architecture still
screams what the application does; it may inject the DAO or DataSource concretely.

**Example.** `application/CreateUser.ts`, `application/MultiUpdateEntity.ts`.

### Application service

**Role.** A reusable piece of application logic, agnostic of the transaction.

**Responsibilities.** Hold logic needed by more than one use case. Join whatever transaction the
caller opened.

**Must not.** Open or commit a transaction. Become a home for logic that belongs on a domain model.

**Needed when.** Two or more use cases need the same behaviour. Not before.

**Example.** `application/EntitiesService.ts`, `application/FilesService.ts`.

### Job

**Role.** A use case executed by a job handler rather than triggered by a user.

**Responsibilities.** Same as a use case; extends `AbstractUseCase`. Lives flat in `application/`
alongside the user-triggered use cases; its handler lives in `infrastructure/jobs/`.

**Example.** `application/PDFPostProcessJob.ts`, handled by
`infrastructure/jobs/PDFPostProcessJobHandler.ts`.

### Contract

**Role.** The interface an outer layer must satisfy — DataSources, `Dispatcher`,
`TransactionManager`, `FileStorage`, directories, query services.

**Responsibilities.** Declare the vocabulary the application needs, in the application's own terms.

**Must not.** Mention a backend, or any type from a driver.

**Needed when.** Full-DDD tier only. The pragmatic tier has no contracts by design.

**Example.** `application/contracts/UsersDataSource.ts`, `application/contracts/UsersDirectory.ts`,
`application/contracts/UsersQueryService.ts`.

### Read model

**Role.** A flat projection for consumers that will not mutate anything.

**Responsibilities.** Describe exactly what its consumers need. Lives in `application/contracts`
alongside the directory that declares it.

**Example.** `application/contracts/UserReadModels.ts`.

## Infrastructure layer

Adapters in both directions: driving (controllers, middleware, job handlers, listeners) and driven
(DAOs, DataSources, directories, query services, mappers, HTTP clients). Persistence components live
under `infrastructure/<backend>/<module>/` — `infrastructure/mongodb/user/` is the reference layout,
holding the DAO, DataSource, directory, query service, mapper, DBO and read options together. This
is what keeps Mongo query language from ever leaving the Mongo folder.

### DAO

**Role.** The component closest to the store, and the seam where a guard can be imposed on every
read and write at once.

**Responsibilities.** Own the collection/table handle and the DBO typing. Enforce the invariants
that must hold for _every_ caller, so that safety is the default and stays the default for code not
yet written. Everything else is built on top of it.

**Must not.** Know a read model, a domain object, or why anyone wants the data. Let callers compose
its guards.

**Needed when.** Always — every module gets one, because it is the seam. What varies is whether it
carries a **read vocabulary**. `MongoUsersDAO` has one (`UserReadOptions`: two guard axes, both
defaulting to exclude, plus named field groups resolved to an _inclusion_ projection, so a field
added to `UserDBO` later stays invisible until deliberately grouped). `MongoUserGroupsDAO` has none
and exposes a generic `find`/`aggregate`, because user groups have no guard to express and a
vocabulary expressing nothing is worse than none. Do not add intent-named methods to a DAO that has
no guard.

**Note.** The two backends' `UserReadOptions` are duplicated on purpose. A shared type would be the
first step back toward a shared DAO contract, which forces a lowest-common-denominator query
vocabulary. The copies must agree on _policy_ — same scope defaults, same field-group membership —
not on signatures.

**Example.** `infrastructure/mongodb/user/MongoUsersDAO.ts`, `MongoUserGroupsDAO.ts`.

### DataSource

**Role.** Persistence for a domain object's lifecycle: load it, save it, delete it.

**Responsibilities.** Speak domain objects. Provide exactly the reads and writes a use case needs to
drive one object through its life. Build on the module's DAO.

**Must not.** Carry query-service-shaped methods — no list-for-a-screen, no projections, no
reporting. Leak persistence shapes outward.

**Example.** `infrastructure/mongodb/user/MongoUsersDataSource.ts`.

### Directory

**Role.** A module's read-facing contract for _other modules_ — a cross-cutting concern (users
today, settings later) that much of the application needs a piece of.

**Responsibilities.** Answer questions internal consumers ask. Return read models. The contract is
published by the module; the implementation is an internal detail and could be swapped for an HTTP
client if the module ever became a service.

**Must not.** Be used to populate the UI. That is what query services are for.

**Example.** contract `application/contracts/UsersDirectory.ts`, implementation
`infrastructure/mongodb/user/MongoUsersDirectory.ts`.

### Query service

**Role.** The read projection that feeds the UI.

**Responsibilities.** Shape data for a screen. Build its queries on the module's DAO.

**Must not.** Be called by a use case, application service or middleware. Return domain objects.

**Where it lives.** Like a directory, it is declared as a contract in `application/contracts` and
implemented per backend in infrastructure — the controller binds to the contract through the
factory. Some query services still have their _implementation_ in `application/`
(`EntitiesQueryService.ts`, `translation/TranslationsQueryService.ts`); that is legacy placement.
New implementations go in infrastructure.

**Example.** contract `application/contracts/UsersQueryService.ts`, implementation
`infrastructure/mongodb/user/MongoUsersQueryService.ts`.

### Mapper

**Role.** Translate DBO ↔ domain object.

**Must not.** Contain business rules.

**Example.** `infrastructure/mongodb/user/MongoUsersMapper.ts`.

### Controller

**Role.** A driving adapter: turn an HTTP request into a use case call and its result into a
response.

**Responsibilities.** Parse and pass input. Map domain errors to status codes. Build the use case
through its factory.

**Must not.** Contain business logic. Touch a DataSource or DAO directly. Return a read model
straight to the client — map it onto the wire contract in `app/shared/contracts/`.

**Example.** `infrastructure/express/users/`, `infrastructure/express/DownloadFileController.ts`.

### Middleware

**Role.** Cross-cutting request concerns — authentication, context setup, logging.

**Example.** `infrastructure/express/middlewares/`.

### Job handler and job registry

**Role.** The handler is a controller for async work; the registry is its route table.

**Responsibilities.** Handler extends `UwaziJobHandler` and implements
`handle(heartbeat, params, jobInfo)`. Mark system jobs `@PrivilegedJob()`.

**Example.** `infrastructure/jobs/`.

### Listener

**Role.** React to a domain event.

**Responsibilities.** Extend `Listener<TEvent, Deps>`, self-register via
`EventEmitterFactory.registry.register(...)`, and be added to `infrastructure/listeners/Listeners.ts`
so registration happens at startup.

**Example.** `infrastructure/listeners/`.

### Factory

**Role.** Build a core object with its dependencies wired.

**Responsibilities.** The only place `ExecutionContext` may be touched — no other layer reaches for
it. One factory per constructed thing.

**Example.** `infrastructure/factories/CreateUserUseCaseFactory.ts`.
