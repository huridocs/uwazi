# Current E2E Coverage (Cypress + Puppeteer)

## Purpose

This document captures what is currently tested, how tests are executed, and where complexity/flakiness pressure is concentrated.

## Framework inventory

- Cypress e2e
  - Config: `cypress.config.cjs`
  - Spec pattern: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
  - Main CI workflow: `.github/workflows/ci_e2e_cypress.yml`
- Puppeteer via Jest (legacy stack still active in CI)
  - Config: `e2e/jest.e2e.config.ts`
  - Main CI workflow: `.github/workflows/ci_e2e_puppeteer.yml`

Pipeline orchestration:

- `.github/workflows/ci_e2e_pipeline.yml` runs both Cypress and Puppeteer jobs after build/precheck.

## Cypress coverage map

Current spec files under `cypress/e2e`:

### Base

- `base/attachments.cy.ts`: main/supporting document attachments lifecycle.
- `base/private-instance.cy.ts`: private/public instance access behavior.
- `base/library-responsiveness.cy.ts`: responsive behaviors in library and side panel.
- `base/main-document-and-references.cy.ts`: references/main document navigation and behavior.
- `base/share-permissions.cy.ts`: sharing and permission transitions.
- `base/full-text-search.cy.ts`: full text search and snippet behavior.
- `base/copy-from.cy.ts`: copy-from flow during entity creation/editing.

### Entities

- `entities/entity.cy.ts`: broad entity/template/property workflows.
- `entities/pdf-display.cy.ts`: PDF display and viewer interactions.
- `entities/relationships-view.cy.ts`: relationship visualization/editing workflows.
- `entities/main-document.cy.ts`: V2 entity main-document route and transitions (currently bugged and disabled in CI).

### Information extraction

- `informationExtraction/information-extraction.cy.ts`: extractor/suggestions lifecycle.
- `informationExtraction/paragraph-extraction.cy.ts`: paragraph extraction flows.

### Pages

- `pages/pages.cy.ts`: page editor/list behavior and page rendering contracts.
- `pages/graphs.cy.ts`: graph widgets on pages.
- `pages/public-form.cy.ts`: public form creation/submission lifecycle.

### Settings

- `settings/account.cy.ts`
- `settings/activitylog.cy.ts`
- `settings/collection.cy.ts`
- `settings/csv-uploads.cy.ts`
- `settings/custom-uploads.cy.ts`
- `settings/customization.cy.ts`
- `settings/filters.cy.ts`
- `settings/groups.cy.ts`
- `settings/languages.cy.ts`
- `settings/menu.cy.ts`
- `settings/mobile-settings-menu.cy.ts`
- `settings/relationship-types.cy.ts`
- `settings/search-filters-default.cy.ts`
- `settings/thesauri.cy.ts`
- `settings/translations.cy.ts`
- `settings/users.cy.ts`

## Puppeteer coverage map

Current spec files under `e2e`:

### suite1

- `suite1/login.test.ts`: login/session/logout behavior.
- `suite1/library.test.ts`: library loading and default table view navigation.
- `suite1/metadataExtraction.test.ts`: metadata extraction feature visibility.

### suite2

- `suite2/multiEdit.test.ts`: multi-select and multi-edit/share/delete flows.
- `suite2/tableView.test.ts`: table view/sidepanel/scrolling behavior.

### mobile

- `mobile/library.test.ts`: responsive toolbar/layout behavior.

## CI execution topology

## Cypress CI shape (`ci_e2e_cypress.yml`)

- Matrix split by domain buckets (`base`, `entities`, `information-extraction`, `paragraph-extraction`, `pages`, `settings-1`, `settings-2`).
- Dynamic toggles by matrix item:
  - `needs_setup`
  - `needs_ix_config`
  - `needs_external_services`
- Shared infra/services:
  - Elasticsearch
  - Redis
  - Mongo replica setup script
- Common preparation:
  - Download `prod` artifact
  - reset DB to blank state (`yarn blank-state`)
  - start app (`.github/scripts/start-uwazi.sh`)

## Puppeteer CI shape (`ci_e2e_puppeteer.yml`)

- Matrix by suite directories: `suite1`, `suite2`, `mobile`.
- Shared infra/services:
  - Elasticsearch
  - Redis
  - Mongo replica set action
- Preparation:
  - Download `prod` artifact
  - restore fixtures (`yarn e2e-fixtures`)
  - start app
  - run `xvfb-run -a yarn e2e-puppeteer-all --roots '<rootDir>/${suite-dir}'`

## Test data and helper infrastructure

- Fixture restore scripts:
  - `uwazi-fixtures/restore.sh`
  - `uwazi-fixtures/restore.blank-e2e.sh`
- Cypress support/commands:
  - `cypress/support/e2e.ts`
  - `cypress/support/commands.js`
  - `cypress/support/e2ecommands.js`
- Puppeteer helper layer:
  - `e2e/helpers/*` (login, fixtures, selectors, regression, transitions, etc.)

## Current risk profile (from test surface)

1. Breadth-heavy end-to-end scenarios mix multiple concerns per spec, increasing blast radius.
2. Some suites rely on responsive/visual/snapshot-style assertions, historically more fragile in CI.
3. Feature-flag and external-service dependent paths (IX/PX) introduce setup variability.
4. Dual-framework maintenance (Cypress + Puppeteer) increases runtime and cognitive overhead.

## Snapshot pressure signals

A quick code scan shows snapshot-related assertions present in both stacks:

- Cypress e2e snapshot references are present across multiple domains, including base, entities, pages, settings, and information extraction specs.
- Puppeteer snapshot usage is abstracted through `e2e/helpers/regression.ts`.

This confirms that reducing snapshot dependence should be a first-order revamp objective.