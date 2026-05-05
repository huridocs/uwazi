# Pruning Proposal: Functional Contract Coverage (Playwright CI)

## Objective

Reduce E2E runtime/flakiness while keeping confidence on critical product contracts, with a single CI-active stack (Playwright).

## CI reality in this branch

- CI E2E active stack: **Playwright only**.
- Active workflows/lanes:
  - `core`: `.github/workflows/ci_e2e_playwright_core.yml`
  - `data`: `.github/workflows/ci_e2e_playwright_data.yml`
  - `ix/px`: `.github/workflows/ci_e2e_playwright_ix.yml` (matrix `ix`, `px`)
- Cypress/Puppeteer are treated as **legacy traceability inputs**, not CI-active suites for this scope.

## Functional coverage matrix (high clarity)

Status meaning:

- `covered-now`: functionality is tested in current CI (Playwright lanes).
- `dropped`: functionality intentionally not tested in current CI scope.
- `missing`: functionality existed in legacy E2E and is not yet migrated to Playwright CI.

| Functional contract | Status | Legacy specs (where it lived) | Current Playwright spec(s) | CI lane | Why now / why changed |
| --- | --- | --- | --- | --- | --- |
| Auth gate + session continuity | covered-now | `base/private-instance.cy.ts`, `suite1/login.test.ts` | `playwright/e2e/auth-gate.contract.spec.ts` | core | Contract kept; migrated to deterministic single-purpose Playwright spec. |
| Library search -> result -> entity navigation | covered-now | `base/full-text-search.cy.ts`, `suite1/library.test.ts` | `playwright/e2e/library-search.contract.spec.ts` | data | Core navigation contract preserved with seeded deterministic dataset. |
| Entity CRUD persistence (create/update/delete) | covered-now | `entities/entity.cy.ts` (partial overlap), `suite2/multiEdit.test.ts` (partial overlap) | `playwright/e2e/entity-crud.contract.spec.ts` | core | Contract-focused CRUD retained; large journey flows trimmed. |
| Main document / attachment rename persistence | covered-now | `base/attachments.cy.ts` | `playwright/e2e/attachments.contract.spec.ts` | data | Kept as high-value file persistence contract, no visual-only checks. |
| Relationships rendering + navigation | covered-now | `entities/relationships-view.cy.ts` | `playwright/e2e/relationships-view.contract.spec.ts` | data | Retained as functional relationship contract with stable UI assertions. |
| Core collection settings persistence | covered-now | `settings/collection.cy.ts` (partial overlap) | `playwright/e2e/settings-core.contract.spec.ts` | core | Kept as representative settings contract (save/reload persisted value). |
| Menu links persistence + home landing behavior | covered-now | `settings/menu.cy.ts` | `playwright/e2e/menu.contract.spec.ts` | core | Kept due to global product impact on navigation and `/` behavior. |
| Languages install + translations edit persistence | covered-now | `settings/languages.cy.ts`, `settings/translations.cy.ts` | `playwright/e2e/languages-translations.contract.spec.ts` | core | Merged into one contract to reduce overhead and preserve functional risk coverage. |
| Pages creation/publication + route resolution | covered-now | `pages/pages.cy.ts` | `playwright/e2e/pages.contract.spec.ts` | core | Kept subset focused on route/content contract; graph checks removed. |
| Public form submission lifecycle | covered-now | `pages/public-form.cy.ts` | `playwright/e2e/public-form.contract.spec.ts` | core | Contract preserved for external/public entrypoint behavior. |
| CSV import lifecycle (UI -> entities searchable) | covered-now | `settings/csv-uploads.cy.ts` (partial overlap) | `playwright/e2e/csv-import.contract.spec.ts` | data | Kept as data-ingestion contract; async completion bounded and deterministic. |
| Metadata extraction lifecycle (IX) | covered-now | `informationExtraction/information-extraction.cy.ts`, `suite1/metadataExtraction.test.ts` | `playwright/e2e/ix-lifecycle.contract.spec.ts` | ix (matrix `ix`) | Kept in dedicated heavy lane; async contract validated with bounded waits. |
| Paragraph extraction lifecycle (PX) | covered-now | `informationExtraction/paragraph-extraction.cy.ts` | `playwright/e2e/paragraph-extraction.contract.spec.ts` | ix (matrix `px`) | Kept in dedicated heavy lane; isolated infra and bounded processing waits. |
| Relationship types admin management | covered-now | `settings/relationship-types.cy.ts` | `playwright/e2e/relationship-types.contract.spec.ts` | core | Migrated CRUD + persistence contract (add/edit/delete, reload). In-use deletion guard left out of scope as a non-contract UX detail. |
| Thesauri admin management | covered-now | `settings/thesauri.cy.ts` | `playwright/e2e/thesauri.contract.spec.ts` | core | Migrated thesaurus CRUD + persistence contract (items, group, edit, delete, reload). DnD reordering and template-usage assertions left out of scope. |
| Users admin management | covered-now | `settings/users.cy.ts` | `playwright/e2e/users.contract.spec.ts` | core | Migrated CRUD persistence contract (create/edit/delete + reload). Bulk actions, role changes, reset 2FA and unblock left out of scope as secondary flows. |
| Account settings deep workflows | covered-now | `settings/account.cy.ts` | `playwright/e2e/account-settings.contract.spec.ts` | core | Migrated full account workflow including password change, re-login with new password, 2FA enable from UI secret, and login with TOTP token. |
| Responsive/layout-only library behavior | dropped | `base/library-responsiveness.cy.ts`, `mobile/library.test.ts` | n/a | n/a | Dropped: high visual/viewport flake, low backend-contract signal. |
| PDF rendering visual fidelity | dropped | `entities/pdf-display.cy.ts` | n/a | n/a | Dropped: pixel/viewer sensitivity; better suited to lower-level tests. |
| Graph widgets in pages | dropped | `pages/graphs.cy.ts` | n/a | n/a | Dropped: chart/visual behavior is high-flake for E2E contract suite. |
| Mobile settings menu UX | dropped | `settings/mobile-settings-menu.cy.ts` | n/a | n/a | Dropped: responsive UX behavior out of contract-first scope. |
| Customization UI (global css/js visual behavior) | dropped | `settings/customization.cy.ts` | n/a | n/a | Dropped: mostly presentation/customization surface, high regression noise. |
| Custom uploads admin workflows | dropped | `settings/custom-uploads.cy.ts` | n/a | n/a | Dropped in current scope; not part of minimum contract spine. |
| Groups/admin management deep flows | dropped | `settings/groups.cy.ts` | n/a | n/a | Dropped in current scope; lower priority than core data/auth/settings contracts. |
| Activity log admin workflows | dropped | `settings/activitylog.cy.ts` | n/a | n/a | Dropped in current scope; lower contract criticality for core product behavior. |
| Share permissions journey flows | missing | `base/share-permissions.cy.ts`, `suite2/multiEdit.test.ts` (partial overlap) | n/a | n/a | Missing: broad multi-concern flow not yet split into stable Playwright contract(s). |
| Copy-from content workflow | dropped | `base/copy-from.cy.ts` | n/a | n/a | Dropped: client-only UX behavior, no backend contract boundary; better covered in frontend component/integration tests. |
| Main-document + references combined journey | missing | `base/main-document-and-references.cy.ts` | n/a | n/a | Missing: needs decomposition into smaller deterministic contract checks. |
| Filters admin management | missing | `settings/filters.cy.ts`, `settings/search-filters-default.cy.ts` | n/a | n/a | Missing: not migrated; candidate for settings-domain contract follow-up. |
| `/entityv2` main document behavior | missing | `entities/main-document.cy.ts` | n/a | n/a | Missing by explicit scope decision: `/entityv2` deferred. |

## Summary counts

- `covered-now`: 17 functional contracts
- `dropped`: 9 functional areas
- `missing`: 5 functional areas

## Why some things are tested differently now

1. Contract-first design
   - We test persisted behavior and route/state contracts, not broad user journeys in one spec.
2. Determinism over visuals
   - Snapshot/pixel-sensitive checks were removed from CI-critical E2E to reduce flake.
3. Async-heavy isolation
   - IX/PX run in dedicated matrix lanes to avoid cross-talk and simplify failure diagnosis.
4. Fixture discipline
   - `blank-e2e-fixtures` for clean-state contracts; `e2e-fixtures` for seeded/data contracts.

## CI lane mapping (current)

| Lane | Workflow | Scope |
| --- | --- | --- |
| core | `.github/workflows/ci_e2e_playwright_core.yml` | auth/settings/pages/entity-crud/public-form/languages-menu/relationship-types/thesauri/users/account |
| data | `.github/workflows/ci_e2e_playwright_data.yml` | library search/csv import/attachments/relationships |
| ix | `.github/workflows/ci_e2e_playwright_ix.yml` matrix `ix` | metadata extraction lifecycle |
| px | `.github/workflows/ci_e2e_playwright_ix.yml` matrix `px` | paragraph extraction lifecycle |

## Next-step backlog (from missing set)

Priority proposal for next migration wave:

1. `share-permissions` contract split into deterministic pieces
2. `settings/filters` contract migration
3. `main-document-and-references` decomposition into deterministic checks
4. `/entityv2` main document contract (when scope unfreezes)

## Acceptance criteria for retained/new E2E

1. Deterministic fixture precondition declared.
2. Stable selectors, no brittle visual dependency.
3. Runtime budget bounded (async waits capped; fail fast on infra issues).
4. Explicit contract statement in test title/steps.
5. No snapshot assertion unless no behavioral alternative exists.
