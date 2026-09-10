# Testing

**Read this when:** you are writing or changing a spec.

The rules below are the whole contract. Where a rule needs a shape, it names a spec to copy rather
than reproducing the code here — open the reference, it is the source of truth.

## The rules

1. **Write the test first.** Watch it fail, and read the failure — it must fail for the reason you
   expect. A test that has never been red proves nothing.

2. **Co-locate specs in a `specs/` directory next to the code they test.** One exception: a
   component with a contract and several implementations is tested once, against the contract
   (rule 8).

3. **Pick the shape from the component.** Domain models get unit tests — no `testingEnvironment`,
   no fixtures, no database. Everything else — use cases, application services, jobs, DAOs,
   DataSources, directories, query services — gets an integration test, with a real database and
   real wiring.
   _Unit reference:_ `domain/user/specs/User.spec.ts`.
   _Integration reference:_ `application/specs/CreateUserGroup.spec.ts`.

4. **Build the system under test through its production factory**, inside
   `testingEnvironment.runWithContext()`. The factory is where the real dependency graph is wired,
   so a hand-assembled object tests a graph that does not ship. See the integration reference.

5. **Never use production code to create fixtures, or to build or verify a test's expectations.** No
   DataSource, DAO, directory, query service, mapper, use case or domain model on either end of a
   test — that includes the arrange step. Fixtures are declared as plain data through
   `getFixturesFactory()` and loaded with `testingEnvironment.setUp`; stored state is asserted
   through `testingEnvironment`. Seeding through the code under test, or reading back through it,
   makes a test that passes when both ends are wrong in the same way — it proves self-consistency,
   not behaviour. The exception is a test _of_ one of those components; fixtures and
   `testingEnvironment` are still what set it up and verify it.

6. **Mock only across a real boundary.** An external HTTP service, the clock, the filesystem, or a
   collaborator that makes the test slow or non-deterministic. Substitute through `runWithContext`
   overrides or the factory's dependencies — never by monkey-patching a module. Mocking a DataSource
   in a use case test is almost always wrong: it deletes the integration the test existed to prove.

7. **Test permissions by overriding the actor** passed to `runWithContext`, which otherwise defaults
   to an editor and a tenant derived from `testingDB`. `setPermissions()` is deprecated — it
   predates the execution context and carries neither tenant nor actor.

8. **Write one contract spec, not one spec per implementation.** Directories, query services and
   DataSources have a contract and an implementation per backend. Put the suite next to the contract
   in `application/specs/` and run it over every backend, sharing fixtures in a single file. Assert
   order-insensitively — Mongo and Postgres share no natural ordering. Adding a method to a contract
   is the red step: `yarn check-types` fails on every implementation until each is written.
   _Reference:_ `application/specs/UsersDirectory.spec.ts`,
   `application/specs/UsersQueryService.spec.ts`, fixtures in
   `application/specs/UsersContractFixtures.ts`.

9. **Opt into Postgres and Elasticsearch only when the test needs them.** Both are off by default
   and enabled through `testingEnvironment.setUp` options; each costs setup time on every run. Where
   a feature is gated by a Mongo→Postgres feature flag, both paths need coverage.

10. **Stop at the async job boundary.** A use case that dispatches a job asserts only that the job
    was dispatched, never the work the job goes on to do. The job gets its own test.

11. **Target specific specs when running them.** Do not sweep `app/api/core` — it is too slow to be
    a feedback loop. Run what you changed, then widen if something looks related.

## What each component gets

- **Domain model** — unit. This is where invariants and state transitions are proven.
- **Use case** — integration, through the factory. Where a feature is actually verified.
- **Application service** — integration, same shape as a use case.
- **DAO** — integration. If it has a read vocabulary, test its guards directly: the default scope
  excludes what it should, a new field is not exposed until grouped.
- **DataSource, directory, query service** — integration, against the contract (rule 8).
- **Job** — integration, testing the job use case directly.
- **Controller / route** — only when it holds real logic, such as error mapping or a retry decision.
  Not for pass-through.
- **Factory, mapper** — no direct tests; covered by the components that use them.
