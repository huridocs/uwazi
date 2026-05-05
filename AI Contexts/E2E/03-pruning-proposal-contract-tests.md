# Pruning Proposal: Contract-First E2E Portfolio

## Objective

Reduce e2e runtime and flakiness while preserving confidence in core frontend-backend contracts.

## Scope decision (current cycle)

- Entity route coverage is scoped to current `/entity` flows.
- `/entityv2` coverage is deferred for now.
- `entities/main-document.cy.ts` is currently bugged and disabled in CI, so it is not a foundation candidate in this phase.

## Principles

1. Contract-first over journey-exhaustive
  Keep only flows that validate critical integration contracts.
2. Deterministic over visual
  Prefer persisted state and API-backed assertions to screenshots/snapshots.
3. Single-purpose specs
  Each spec should validate one contract family, not full user stories.
4. Minimize setup variance
  Limit external-service dependent tests to a small dedicated lane.
5. Remove overlap across frameworks
  Avoid validating the same contract in both Cypress and Puppeteer.

## Proposed target e2e spine

## P0 contracts (must keep)

1. Authentication gate and protected access
  - Login/session/logout behavior  
  - Private instance redirect/auth requirement
2. Library search/listing contract
  - Query -> results -> entity navigation
3. Entity persistence contract
  - Create/update/delete and post-save visibility
4. Core settings persistence contract
  - One high-value setting per domain family (collection/menu/templates/thesauri)
5. Public submission contract
  - Public form submission creates expected entity state

## P1 contracts (small, focused lane)

1. Metadata extraction lifecycle (IX) status transitions
2. Paragraph extraction lifecycle status transitions
3. CSV import lifecycle state progression

## Assertion strategy (de-snapshot)

Replace or minimize:

- Image snapshots of dynamic layouts
- Pixel-sensitive UI checks
- Time-based waits for async completion

Use instead:

- URL/route assertions
- Role/permission gate assertions
- Persisted data assertions via deterministic UI state
- Status/event completion checkpoints for async jobs
- Stable selectors and explicit preconditions

## Keep / merge / retire proposal

This is an initial classification for the current set. “Merge” means folding into smaller contract-centric specs.

## Cypress - Base

- Keep:
  - `base/private-instance.cy.ts`
  - `base/full-text-search.cy.ts`
- Replaced by Playwright contract:
  - `base/attachments.cy.ts` -> [`playwright/e2e/attachments.contract.spec.ts`](../../playwright/e2e/attachments.contract.spec.ts) (rename + reload UI persistence; seeded; data lane)
- Merge:
  - `base/main-document-and-references.cy.ts`
  - `base/share-permissions.cy.ts`
  - `base/copy-from.cy.ts`
- Retire:
  - `base/library-responsiveness.cy.ts` (mostly responsive/visual behavior)

## Cypress - Entities

- Keep:
  - none in current state
- Replaced by Playwright contract:
  - `entities/relationships-view.cy.ts` -> [`playwright/e2e/relationships-view.contract.spec.ts`](../../playwright/e2e/relationships-view.contract.spec.ts) (hub navigation to related entity; seeded; data lane)
- Merge:
  - `entities/entity.cy.ts`
- Retire:
  - `entities/pdf-display.cy.ts` (high visual sensitivity; move to lower-level tests if needed)
  - `entities/main-document.cy.ts` (temporarily out of scope until `/entityv2` is re-enabled and stable in CI)

## Cypress - Pages

- Keep:
  - `pages/public-form.cy.ts`
- Replaced by Playwright contract:
  - `pages/pages.cy.ts` (subset) -> [`playwright/e2e/pages.contract.spec.ts`](../../playwright/e2e/pages.contract.spec.ts) (page creation + URL resolution renders custom marker; blank; core lane). Graph rendering and landing-page-from-page flows remain out of scope.
- Retire:
  - `pages/graphs.cy.ts` (visual/chart behavior is high-flake for e2e)

## Cypress - Settings

- Keep:
  - `settings/account.cy.ts`
  - `settings/collection.cy.ts`
  - `settings/users.cy.ts`
  - `settings/thesauri.cy.ts`
  - `settings/relationship-types.cy.ts`
  - `settings/filters.cy.ts`
- Replaced by Playwright contract:
  - `settings/menu.cy.ts` -> [`playwright/e2e/menu.contract.spec.ts`](../../playwright/e2e/menu.contract.spec.ts) (link persistence in nav + landing page setting persists in collection; blank; core lane)
  - `settings/languages.cy.ts` + `settings/translations.cy.ts` -> [`playwright/e2e/languages-translations.contract.spec.ts`](../../playwright/e2e/languages-translations.contract.spec.ts) (install language + edit one translation + reload UI persistence; blank; core lane)
- Merge:
  - `settings/csv-uploads.cy.ts`
  - `settings/search-filters-default.cy.ts`
- Retire:
  - `settings/mobile-settings-menu.cy.ts`
  - `settings/customization.cy.ts`
  - `settings/custom-uploads.cy.ts`
  - `settings/groups.cy.ts`
  - `settings/activitylog.cy.ts`

## Cypress - Information extraction

- Keep:
  - `informationExtraction/information-extraction.cy.ts` (trim to status/accept contracts)
  - `informationExtraction/paragraph-extraction.cy.ts` (trim to status/execution contracts)
- Retire:
  - none initially (but reduce scope aggressively inside both specs)

## Puppeteer (legacy lane)

- Keep (temporary while migrating confidence to Cypress contract specs):
  - `suite1/login.test.ts`
  - `suite1/library.test.ts`
- Merge:
  - `suite2/multiEdit.test.ts`
  - `suite2/tableView.test.ts`
  - `suite1/metadataExtraction.test.ts`
- Retire:
  - `mobile/library.test.ts`

Recommended direction: progressively decommission Puppeteer once equivalent Cypress contract coverage is confirmed green and stable.

## Proposed post-pruning suite shape

Playwright is the target framework for the new contract specs. CI lanes follow the existing workflows (`core`, `data`, `ix`).

| # | Spec | Lane | Fixture | Source |
| - | ---- | ---- | ------- | ------ |
| 1 | [`auth-gate.contract.spec.ts`](../../playwright/e2e/auth-gate.contract.spec.ts) | core | blank | new |
| 2 | [`settings-core.contract.spec.ts`](../../playwright/e2e/settings-core.contract.spec.ts) | core | blank | new |
| 3 | [`public-form.contract.spec.ts`](../../playwright/e2e/public-form.contract.spec.ts) | core | blank | new |
| 4 | [`entity-crud.contract.spec.ts`](../../playwright/e2e/entity-crud.contract.spec.ts) | core | blank | new |
| 5 | [`languages-translations.contract.spec.ts`](../../playwright/e2e/languages-translations.contract.spec.ts) | core | blank | replaces `settings/languages.cy.ts` + `settings/translations.cy.ts` |
| 6 | [`menu.contract.spec.ts`](../../playwright/e2e/menu.contract.spec.ts) | core | blank | replaces `settings/menu.cy.ts` (subset) |
| 7 | [`pages.contract.spec.ts`](../../playwright/e2e/pages.contract.spec.ts) | core | blank | replaces `pages/pages.cy.ts` (subset) |
| 8 | [`library-search.contract.spec.ts`](../../playwright/e2e/library-search.contract.spec.ts) | data | seeded | new |
| 9 | [`csv-import.contract.spec.ts`](../../playwright/e2e/csv-import.contract.spec.ts) | data | blank | new |
| 10 | [`attachments.contract.spec.ts`](../../playwright/e2e/attachments.contract.spec.ts) | data | seeded | replaces `base/attachments.cy.ts` (subset) |
| 11 | [`relationships-view.contract.spec.ts`](../../playwright/e2e/relationships-view.contract.spec.ts) | data | seeded | replaces `entities/relationships-view.cy.ts` (subset) |
| 12 | [`ix-lifecycle.contract.spec.ts`](../../playwright/e2e/ix-lifecycle.contract.spec.ts) | ix (matrix `ix`) | seeded + dummies | new |
| 13 | [`paragraph-extraction.contract.spec.ts`](../../playwright/e2e/paragraph-extraction.contract.spec.ts) | ix (matrix `px`) | seeded + dummies | new |

For `entity-crud.contract.spec.ts`, initial implementation targets `/entity` contracts only.

## Coverage recovered by the second pruning pass

The five extra contract specs added in this pass restore UI-driven coverage of the highest-impact behaviors that were initially marked as "merge" or "retire":

- Attachment/main document rename persists across reload (entity files contract).
- Hub-based relationships render and navigate to the related entity (relationship persistence + navigation contract).
- Language install + translation edit round-trip persists in UI (i18n + translation pipeline contract).
- Menu link persists in the primary nav, and landing page setting persists in collection (global navigation + home routing contract).
- Custom page creation, save, URL resolution renders the published marker (page lifecycle contract).

Coverage that remains intentionally out of scope (still considered too flaky or low value for E2E):

- Pixel-level visual snapshots (`matchImageSnapshot`) and accessibility scans (`cypress-axe`).
- Layout/viewport-sensitive specs (`base/library-responsiveness.cy.ts`, `settings/mobile-settings-menu.cy.ts`).
- Heavy graphs/charts (`pages/graphs.cy.ts`).
- PDF rendering visual checks (`entities/pdf-display.cy.ts`).
- Multi-step content management with no contract value at the boundary (e.g., `settings/customization.cy.ts`, `settings/custom-uploads.cy.ts`, `settings/groups.cy.ts`, `settings/activitylog.cy.ts`).

## CI simplification guidance (next phase)

1. Keep matrix sharding, but map shards to contract suites instead of broad folders.
2. Isolate heavy external dependencies to one dedicated lane.
3. Fail fast on deterministic lanes; allow retries only for async-heavy lanes.
4. Publish debug artifacts only for failing lanes to keep signal clear.

## Acceptance criteria for each retained/new e2e

1. Deterministic fixture precondition declared
2. Stable selectors and no brittle visual dependency
3. Max runtime budget per spec defined
4. Explicit contract statement in test title/comment
5. No snapshot assertion unless there is no viable behavioral alternative