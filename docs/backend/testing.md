# Testing

Tests are co-located in `specs/` directories next to the code they test — with one exception:
a component that has a contract and several implementations is tested **once, against the
contract**. See _Contract specs_.

**Write the test first.** Watch it fail, and read the failure — it must fail for the reason you
expect. A test that has never been red proves nothing.

## The two shapes

Almost everything here is one of two kinds of test, and the component tells you which.

**Unit, DB-free** — domain models. Construct the object, exercise the behavior, assert on the
object. No `testingEnvironment`, no fixtures, no database.

```ts
const user = new User({ _id: 'user1', username: 'user1', role: UserRole.EDITOR, email: '…' });

user.updateProfile({ username: 'renamed', role: UserRole.ADMIN, email: '…' });

expect(user.username).toBe('renamed');
```

**Integration** — use cases, application services, jobs, DAOs, DataSources, directories, query
services. Real database, real wiring, fixtures in and stored state out.

## The integration shape

Every integration spec follows the same skeleton. Copy it rather than inventing one.

```ts
const f = getFixturesFactory();

const fixtures = {
  usergroups: [f.usergroup('Existing')],
};

const createSut = () =>
  testingEnvironment.runWithContext(() => CreateUserGroupUseCaseFactory.default());

describe('CreateUserGroupUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should create a group with the given name and members', async () => {
    const created = await createSut().execute({ name: 'New group', memberIds: [] });

    expect(created.name).toBe('New group');
    const stored = await testingEnvironment.db.getAllFrom('usergroups');
    expect(stored).toContainEqual(expect.objectContaining({ name: 'New group' }));
  });
});
```

Reference: `application/specs/CreateUserGroup.spec.ts`.

### Build the SUT with the real factory

`createSut()` builds the system under test **through its production factory**, inside
`testingEnvironment.runWithContext()`. This is not a formality — the factory is where the real
dependency graph is wired, so a test that hand-assembles the object is testing a graph that does not
ship.

Name it `createSut`, and call it inside the `it`, not in a `beforeEach`. Each test gets its own
instance and the context is live at the moment of construction.

### Fixtures in, database out

Set up state with `testingEnvironment.setUp(fixtures)` and build the fixtures with
`getFixturesFactory()`. Assert on stored state with `testingEnvironment.db.getAllFrom(collection)`
(or `testingEnvironment.pg.getAllFrom(table)`).

> **Never use production code to build or verify a test's expectations.** No DataSource, DAO,
> directory, query service or mapper on either end of a test. Reading back through the same
> component you just wrote through makes a test that passes when both are wrong in the same way —
> it verifies self-consistency, not behavior. Fixtures and `testingEnvironment` exist so that a
> test's setup and assertions never travel through the code under test.

The exception is a test _of_ one of those components: a DataSource spec exercises the DataSource,
and then fixtures and `testingEnvironment.db` are still what set up and verify it.

### Mocks only when necessary

The database is real, the wiring is real. Reach for a mock only when the collaborator is genuinely
outside the boundary — an external HTTP service, the clock, the filesystem — or when the real thing
makes the test slow or non-deterministic. Substitute through `runWithContext` overrides or the
factory's dependencies; never by monkey-patching a module.

Mocking a DataSource in a use case test is almost always wrong: it deletes the integration the test
existed to prove.

### Actors and permissions

`runWithContext` defaults to an **editor** actor and a tenant derived from `testingDB`. Test
permission behaviour by overriding the actor:

```ts
const createSut = (actor?: User) =>
  testingEnvironment.runWithContext(() => DeleteUsersUseCaseFactory.default(), { actor });
```

`setPermissions()` is deprecated — it predates `ExecutionContext` and carries no tenant or actor.
Use `runWithContext`.

### Postgres and Elasticsearch

Off by default. Opt in through `setUp` options: `{ postgres: true }`, `{ elasticIndex: 'name' }`,
`{ postgresMirror: [...] }`. Only opt in when the test needs them — each one costs setup time on
every run.

Where a feature is gated by a Mongo→Postgres feature flag, both paths need coverage.

### Contract specs

Directories, query services and DataSources have one contract and one implementation per backend.
Do not write a spec per implementation — write one suite next to the **contract**, in
`application/specs/`, and run it over every backend:

```ts
describe.each(testConfigs)('$backend', ({ featureFlags }) => {
  beforeEach(async () => {
    testingTenants.changeCurrentTenant({ featureFlags });
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });
  ...
});
```

Share the fixtures across backends in a single file (`application/specs/UsersContractFixtures.ts`).
Assert order-insensitively — Mongo and Postgres share no natural ordering.

Reference: `application/specs/UsersDirectory.spec.ts`, `application/specs/UsersQueryService.spec.ts`.

Adding a method to a contract is the red step: `yarn check-types` fails on every implementation
until each one is written.

## What to test, per component

- **Domain model** — unit, DB-free. This is where invariants and state transitions are proven.
- **Use case** — integration, through the factory. The main event: this is where a feature is
  actually verified.
- **Application service** — integration, same shape as a use case.
- **DAO** — integration. If it has a read vocabulary, its guards deserve direct tests: the default
  scope excludes what it should, a new field is not exposed until grouped.
- **DataSource, directory, query service** — integration.
- **Job** — integration, testing the job use case directly.
- **Controller / route** — only when it holds meaningful logic, such as error mapping or a retry
  decision. Not for pass-through.
- **Factory, mapper** — no direct tests; they are covered by the components that use them.

### The async job boundary

A use case that dispatches a job asserts **only that the job was dispatched** — never the work the
job goes on to do. The job gets its own test. Crossing that boundary produces slow tests that fail
for reasons unrelated to the use case.

## Running tests

**Target specific specs.** Do not run broad sweeps of `app/api/core` — it is slow enough to be
unusable as a feedback loop. Run the specs for what you changed, then widen if something looks
related.
