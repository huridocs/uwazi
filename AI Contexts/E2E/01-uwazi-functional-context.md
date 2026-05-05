# Uwazi Functional Context (Deep Baseline)

## Purpose

This document maps how Uwazi works at product and system level so e2e scope decisions can be made against real behavior contracts, not only UI flows.

## Authoritative entry points

- Frontend route map: `app/react/Routes.tsx`
- Settings information architecture: `app/react/V2/Routes/Settings/SettingsNavigation.tsx`
- Backend API registration map: `app/api/api.js`
- Index/home routing behavior: `app/react/getIndexElement.tsx`

## Runtime composition

Uwazi composes the app through:

1. A route-driven React frontend (`app/react/Routes.tsx`)
2. A modular Express API (`app/api/api.js`)
3. Socket events for cross-session consistency (`app/react/App/sockets.js`, `app/api/socketio/setupSockets.ts`)

The practical implication for e2e is that many user-visible transitions are async/event-driven, so stable tests must assert eventual state instead of timing-based visual transients.

## Product sections and capabilities

## 1) Authentication and account lifecycle

Primary contracts:

- `POST /api/login`, `GET /api/user`, `GET /logout` (`app/api/auth/routes.js`)
- Password reset/unlock (`app/api/users/routes.js`)
- 2FA management (`app/api/auth2fa/routes.ts`)

User capabilities:

- Sign in/out
- Recover/reset account credentials
- Enable and use 2FA
- Edit profile/password in settings (`settings/account`)

## 2) Library (core discovery workspace)

Primary UI routes:

- `/library`
- `/library/table`
- `/library/map`

Contract surface:

- Search APIs (`app/api/search/routes.ts`, `app/api/search.v2/routes.ts`)
- Entity retrieval (`app/api/entities/routes.js`)
- Library query orchestration (`app/react/Library/actions/libraryActions.js`)

User capabilities:

- Search, filter, sort, paginate content
- Switch cards/table/map views
- Open entities and navigate to related content
- Trigger bulk operations depending on role

## 3) Entity and document experience

Primary routes:

- Legacy: `/entity/:sharedId` and document views
- V2: `/entityv2/:sharedId`

Contract surface:

- Entity CRUD and retrieval (`app/api/entities/routes.js`)
- Document endpoints (`app/api/documents/routes.ts`)
- Relationship endpoints (`app/api/relationships/routes.js`)

User capabilities:

- View metadata, files, and relationships
- Edit entity data (by role)
- Navigate document references and extracted text contexts

## 4) Settings (admin/editor control plane)

Settings navigation and role/feature gating are explicitly defined in:

- `app/react/V2/Routes/Settings/SettingsNavigation.tsx`
- `app/react/Routes.tsx`

Major sections:

- Account
- Dashboard
- Users & Groups
- Collection
- Menu
- Pages
- Templates
- Thesauri
- Relationship types
- Languages
- Translations
- Filters
- Activity log
- Global CSS/JS customization
- Custom uploads
- CSV import
- Metadata Extraction (IX)
- Paragraph Extraction
- Preserve
- New relationships migration (feature-flagged)

## 5) Public and external-facing capabilities

Key area:

- Public forms and submissions, including file/media and anti-abuse constraints (`app/api/files/jsRoutes.js`, `app/api/settings/routes.ts`)

## Contract boundaries that matter for e2e

## Roles and authorization

- Frontend gate: `ProtectedRoute` and `NeedAuthorization` in routes/navigation
- Backend source of truth: `needsAuthorization(...)` in API route modules

Stable e2e should verify both:

- Forbidden actions are hidden/blocked in UI
- Protected endpoints remain enforced server-side

## Feature flags and behavior forks

Some flows fork between legacy and V2 logic based on tenant feature flags.

Examples:

- Entity get/update/multi-update in `app/api/entities/routes.js`
- Metadata extraction and paragraph extraction visibility in settings navigation and backend routes

e2e implication: tests should explicitly set preconditions around flags to avoid nondeterministic path execution.

## Async + socket-driven transitions

Important socket-driven updates include:

- `templateChange`, `templateDelete`
- `thesauriChange`, `thesauriDelete`
- `updateSettings`
- translation lifecycle events
- `documentProcessed` / conversion events
- CSV import progress events

Source:

- `app/react/App/sockets.js`

e2e implication: use deterministic “eventual state” checks (API-backed or persisted UI state), avoid hard sleeps.

## Long-running operations

The following families are async and should be tested with status semantics:

- Metadata extraction training/process/accept (`app/api/suggestions/routes.ts`)
- CSV import lifecycle (`app/api/csv.v2/infrastructure/http/routes.ts`)
- Document processing and OCR (`app/api/files/routes.ts`, `app/api/files/ocrRoutes.ts`)

## Home/index behavior and private/public entry

Index behavior is settings-driven in `app/react/getIndexElement.tsx`:

- Default to library (cards/map/table) with private-instance login gate
- Route to custom page or entity as home
- Redirect to custom paths

This is a high-value contract area because one settings change can alter first-render behavior for all users.

## Core workflows to anchor future e2e scope

1. Authenticated access and session continuity
2. Library query -> result rendering -> entity navigation
3. Entity create/update/delete (including files) with persisted state checks
4. Schema layer changes (templates/thesauri/relationship types) and downstream effect
5. Settings persistence (collection/menu/pages/filters)
6. Public form submission lifecycle
7. IX / paragraph extraction lifecycle transitions

## Why this context is relevant for revamp

This map identifies stable “contracts” where small, deterministic e2e checks provide high confidence:

- route + role gates
- API persistence guarantees
- event-driven consistency guarantees
- feature-flagged behavior branches

These are better revamp anchors than broad visual traversal or snapshot-heavy path permutations.