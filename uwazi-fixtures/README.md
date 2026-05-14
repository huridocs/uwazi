# Uwazi E2E Fixture Profiles

This directory now provides two fixture profiles for e2e work.

## Profiles

## 1) Seeded profile (`e2e-fixtures`)

Command:

`yarn e2e-fixtures`

What it does:

1. Drops target DB
2. Restores `seeded_e2e` dump generated from Playwright bootstrap
3. Copies fixture documents from `uwazi-fixtures/uploaded_documents/seeded_e2e` into `uploaded_documents`
4. Runs migrations
5. Reindexes Elasticsearch

Seed data characteristics (playwright bootstrap dataset):

- Languages installed: `en`, `es`, `ar`
- Thesaurus: `Super powers`
- Template `Heroes` with powers and organization relationship
- Template `Organizations`
- Hero entities:
  - `Midnight Guardian`
  - `Solaris`
  - `Iron Mind`
  - `Shadow Runner`
  - `Aqua Sentinel`
- One document per language (`english`, `spanish`, `arabic`) uploaded for each hero
- Relationships between heroes and organizations (`The Good Ones`, `The Bad Ones`)

Bootstrap sources:

- `playwright/e2e/bootstrap-state.spec.ts`
- `playwright/e2e/helpers/setupData.ts`

Refresh command:

- `yarn playwright:bootstrap-dump`

## 2) Blank profile (`blank-e2e-fixtures`)

Command:

`yarn blank-e2e-fixtures`

What it does:

1. Drops target DB
2. Restores `uwazi-fixtures/dump/blank_e2e`
3. Resets `uploaded_documents` and copies from `uwazi-fixtures/uploaded_documents/blank_e2e`
4. Runs migrations
5. Reindexes Elasticsearch

Use this profile when tests should start from a fresh Uwazi instance.

## PDF source and location

Fixture files are versioned per fixture profile and live in:

- `uwazi-fixtures/uploaded_documents/seeded_e2e`
- `uwazi-fixtures/uploaded_documents/blank_e2e`
- `uwazi-fixtures/uploaded_documents/uwazi_development`

Each restore script now copies files from the corresponding profile folder.

## Dump refresh behavior

- `./uwazi-fixtures/create.seeded-e2e-dump.sh` now refreshes:
  - Mongo dump at `uwazi-fixtures/dump/seeded_e2e/uwazi_e2e`
  - File fixtures at `uwazi-fixtures/uploaded_documents/seeded_e2e`
- `./uwazi-fixtures/dump.sh <db> <host> <profile>` writes:
  - Mongo dump to `uwazi-fixtures/dump/<profile>/<db>`
  - Files to `uwazi-fixtures/uploaded_documents/<profile>`

## Manual validation checklist

## Seeded profile (`yarn e2e-fixtures`)

- Restore command exits successfully
- Templates `Heroes` and `Organizations` exist in Settings > Templates
- Hero entities are present with the expected powers and organization relationship
- Each hero has one PDF per language (`english`, `spanish`, `arabic`)
- `settings.languages` includes `en`, `es`, and `ar` (with Arabic RTL fields)

## Blank profile (`yarn blank-e2e-fixtures`)

- Restore command exits successfully
- No seeded business templates/entities from seeded profile are present
- `uploaded_documents` is empty after restore

## Both profiles

- Migrations complete without errors
- Reindex completes without errors
- No orphan file reference (entity references file not present on disk)
