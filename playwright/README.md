# Playwright Bootstrap E2E

This Playwright test creates a deterministic dataset from `blank-e2e-fixtures` for later fixture extraction.

## What it does

- Resets DB with `yarn blank-e2e-fixtures`
- Logs in as admin
- Creates thesaurus `Super powers`
- Creates templates `Heroes` and `Organizations`
- Creates organization entities `The Good Ones` and `The Bad Ones`
- Creates 5 hero entities in `en/es/ar`:
  - Midnight Guardian
  - Solaris
  - Iron Mind
  - Shadow Runner
  - Aqua Sentinel
- Uploads 3 PDFs per hero (`english`, `spanish`, `arabic`) from:
  - `playwright/fixtures/pdfs`

## Run

1. Install dependencies:
  - `yarn install`
  - `yarn playwright install`
2. Start Uwazi:
  - `DATABASE_NAME=uwazi_e2e INDEX_NAME=uwazi_e2e yarn hot`
3. Run bootstrap:
  - `yarn playwright:bootstrap`

## Auth contract e2e (blank fixtures)

Run:

- `yarn playwright:auth-contract`

What it validates:

- Protected route redirects to login when session is missing.
- Admin login establishes an authenticated session.
- Authenticated admin can access account settings.
- Logout removes access and protected routes redirect back to login.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` to start with deterministic preconditions.
- Attempt to enter `/settings` without session and verify auth gate redirect to `/login`.
- Authenticate with `admin/admin` and confirm backend session cookie exists.
- Navigate to `/settings/account` to validate protected access after login.
- Trigger logout from account settings.
- Re-open `/settings` and verify redirect to `/login` again (gate restored).

## Library search contract e2e (seeded fixtures)

Run:

- `yarn playwright:test playwright/e2e/library-search.contract.spec.ts --workers=1`

What it validates:

- A logged-in admin can execute library search queries.
- Search requests return results for seeded data (`e2e-fixtures`).
- A search result can be used to navigate to an `/entity/:id` route.

## Spec steps

- Reset Uwazi with `e2e-fixtures` to start from a deterministic dataset with entities and files.
- Log in as `admin/admin` and open library view with stable query params.
- Run search attempts over seeded keywords until one returns non-empty `/api/search` results.
- Assert URL query state reflects a real search term (`searchTerm` present).
- Navigate to the returned entity and confirm `/entity/:id` route resolves.

## Entity CRUD contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/entity-crud.contract.spec.ts --workers=1`

What it validates:

- Admin can create a new entity from `/library`.
- Entity title update persists and is visible on `/entity/:id`.
- Entity can be deleted and is no longer returned in library search.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` for deterministic empty-state CRUD.
- Log in as `admin/admin` and create a new entity with a unique timestamped title.
- Capture `sharedId` from `POST /api/entities` and open `/entity/:id` directly.
- Edit and save the title, then confirm the updated title is rendered on entity view.
- Delete the entity and confirm a follow-up search returns zero results.

## Settings core contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/settings-core.contract.spec.ts --workers=1`

What it validates:

- Admin can update core collection settings.
- Collection name persists after save and page reload.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures`.
- Log in as admin and open `/settings/collection`.
- Change collection name to a unique value and save settings.
- Reload the settings page and verify the saved value remains.

## Public form contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/public-form.contract.spec.ts --workers=1`

What it validates:

- Public endpoint `/api/public` accepts a form submission for allowed templates.
- Public submission creates an entity persisted in the database.
- Created entity is retrievable by an authenticated admin via `/api/entities`.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` and authenticate as admin.
- Read available templates and enable `openPublicEndpoint` plus `allowedPublicTemplates`.
- Submit a public payload through `/api/public` using bypass + ajax headers.
- Log in again as admin and verify the submitted title exists for the returned `sharedId`.

## CSV import contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/csv-import.contract.spec.ts --workers=1`

What it validates:

- Admin can navigate to CSV imports in Settings and open the import modal.
- Admin can upload CSV content from the UI and submit the import.
- Import result appears in the table with terminal lifecycle status and available detail action.
- Imported rows produce real entities that are searchable in Library.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` and authenticate as admin.
- Open `/settings/csv`, confirm blank-state messaging, and open the import modal.
- Upload an in-memory CSV through the file input and accept the import from the modal.
- Wait for a terminal status row in the imports table and verify the row is actionable.
- Go to Library and assert each imported title returns search results.

## Attachments contract e2e (seeded fixtures)

Run:

- `yarn playwright:test playwright/e2e/attachments.contract.spec.ts --workers=1`

What it validates:

- Admin can open a seeded entity sidepanel with existing files.
- Admin can rename a primary document from the UI.
- Renamed filename persists after reloading and reopening the same entity sidepanel.

## Spec steps

- Reset Uwazi with `e2e-fixtures` and authenticate as admin.
- Open Library with stable query params and search a seeded hero (`Midnight`).
- Open the entity sidepanel and assert at least one file row exists.
- Edit the first file `originalname`, save, and verify the new filename appears.
- Reload Library, reopen the same sidepanel, and verify renamed filename is still present.

## Relationships view contract e2e (seeded fixtures)

Run:

- `yarn playwright:test playwright/e2e/relationships-view.contract.spec.ts --workers=1`

What it validates:

- Admin can open the Relationships tab for a seeded entity.
- Relationships hub content is rendered with at least one relationship item.
- Clicking a relationship item opens related entity preview navigation affordances in UI.

## Spec steps

- Reset Uwazi with `e2e-fixtures` and authenticate as admin.
- Search seeded hero (`Midnight`) from Library and open entity view via sidepanel.
- Open Relationships tab and assert hub container and relationship rows are visible.
- Click a relationship row and verify active preview sidepanel shows entity navigation link.

## Languages + translations contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/languages-translations.contract.spec.ts --workers=1`

What it validates:

- Admin can install a new language from Languages settings.
- Admin can edit one system translation from Translations settings.
- Edited translation value persists after reload.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` and authenticate as admin.
- Open `/settings/languages`, install `Spanish`, and wait until language row appears.
- Open `/settings/translations`, enter a system translation context, and edit ES value.
- Save and verify success notification.
- Reload edit view and confirm the ES input keeps the saved value.

## Menu contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/menu.contract.spec.ts --workers=1`

What it validates:

- Admin can add and save a custom menu link from settings.
- Saved menu link is still present after reload.
- Menu link is visible from home UI.
- Collection landing page (`home_page`) persists after save and reload.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` and authenticate as admin.
- Open `/settings/navlinks`, add a link, save, and verify button state indicates persisted save.
- Reload navlinks settings and assert link row is present.
- Open `/` and verify the custom link is rendered.
- Open `/settings/collection`, set `landing-page`, save, reload, and assert persisted value.

## Pages contract e2e (blank fixtures)

Run:

- `yarn playwright:test playwright/e2e/pages.contract.spec.ts --workers=1`

What it validates:

- Admin can create a page from Settings > Pages.
- Markdown content is saved and page URL is generated.
- Published URL resolves and renders expected marker content.

## Spec steps

- Reset Uwazi with `blank-e2e-fixtures` and authenticate as admin.
- Open `/settings/pages`, create a new page title, and add marker HTML in Markdown tab.
- Save page and capture generated `page-url`.
- Navigate to generated URL and verify marker heading is rendered.

## IX lifecycle contract e2e (seeded fixtures)

Run:

- `yarn playwright:test playwright/e2e/ix-lifecycle.contract.spec.ts --workers=1`

What it validates:

- Admin can create an IX extractor from Metadata Extraction UI for `Heroes -> BIO`.
- Test waits for Mongo `segmentations` with `status: ready` before training.
- Admin marks entities for training and triggers `Train model` with `Find suggestions after training`.
- Admin accepts one English suggestion (`Aqua Sentinel (en)`).
- Accepted suggestion changes the actual value shown in the sidepanel input (`field`) for that same row.

## Spec steps

- Log in as `admin/admin` (fixtures are expected to be pre-restored).
- Create a new extractor in UI using template `Heroes` and property `BIO`, then open `Review`.
- Mark at least two rows with `Use for training`.
- Poll Mongo (`uwazi_e2e.segmentations`) until there is at least one document with `status: ready` (bounded to 60s).
- Open `Train model`, enable `Find suggestions after training`, and run training.
- Wait for `/api/suggestions/status` to reach `ready` (bounded to 60s), then close modal if still open.
- Target row `Aqua Sentinel (en)`, open sidepanel, and capture the current `input[name="field"]` value.
- Accept suggestion on that same row, wait for `Suggestions updated`, reopen sidepanel, and assert `input[name="field"]` changed.

## Paragraph extraction contract e2e (seeded fixtures)

Run:

- `yarn playwright:test playwright/e2e/paragraph-extraction.contract.spec.ts --workers=1`

What it validates:

- Admin can create a paragraph extractor from the Paragraph Extraction UI wizard.
- Extractor detail view lists source entities for the selected source template.
- PX extraction runs only when source PDFs already have ready segmentations.
- Paragraph extraction controls are visible in the extractor detail page for follow-up runs.

## Spec steps

- Log in and prepare PX-compatible source/target templates (fixtures are expected to be pre-restored).
- Create one source entity and an additional relation type required by PX validation rules.
- Wait for background processing to produce at least one `processed` row in extractor status (bounded to 60s).
- Navigate to Paragraph Extraction settings and complete the wizard from the UI.
- Open extractor detail (View), validate that entity rows are present, and that extraction controls are visible.

## Notes

- This is intended for manual/local execution to generate DB state.
- CI lane mapping for Playwright contracts:
  - Core lane (`.github/workflows/ci_e2e_playwright_core.yml`): `auth-gate`, `settings-core`, `public-form`, `entity-crud`, `languages-translations`, `menu`, `pages`.
  - Data lane (`.github/workflows/ci_e2e_playwright_data.yml`): `library-search`, `csv-import`, `attachments`, `relationships-view`.
- In CI, IX/PX run in `.github/workflows/ci_e2e_playwright_ix.yml` as a matrix (`ix` / `px`) with isolated jobs.
- CI restores `e2e-fixtures` before starting Uwazi; IX/PX specs no longer run `yarn e2e-fixtures` internally.
- CI bootstraps dummy extractor services with detached processes and queue-health checks before running the specs.

