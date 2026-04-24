## Notifications system context

Last updated: 2026-04-01

### Purpose

This document explains Uwazi's current notifications system in V2, including:

- architecture and state model
- how to show one-off notifications
- how to register realtime task progress
- where socket integrations live
- current UX behavior in the top bar/panel
- extension patterns for developers and AI agents

---

### Scope

This context describes the current V2 notifications implementation used by:

- top bar request status UI (`RequestStatus`)
- notifications panel (notifications + tasks)
- language install/uninstall realtime updates
- IX realtime progress updates
- generic success/warning/error/info messages from routes/hooks

It does **not** describe the old legacy Redux-only alert flow.

---

### Core architecture

#### 1) State source of truth

`app/react/V2/atoms/requestStatusAtom.ts`

Main state:

- `notifications: StatusNotification[]`
- `unreadNotificationIds: string[]`
- `tasks: StatusTask[]`
- `isConnected: boolean`
- `isPanelOpen: boolean`
- `isLoading: boolean`

Computed:

- `overallStatus: 'loading' | 'error' | 'warning' | 'success'`
  - `loading` wins if `isLoading`
  - then unread `error`
  - then unread `warning`
  - otherwise `success`

Important types:

- `NotificationType = 'success' | 'warning' | 'error' | 'info'`
- `TaskStatus = 'running' | 'completed' | 'failed'`

#### 2) React API

`useRequestStatus()` exposes:

- notifications API: `notify`, `removeNotification`, `clearNotifications`, `clearAll`
- task API: `registerTask`, `updateTask`, `endTask`, `removeTask`
- UI state API: `setConnected`, `togglePanel`
- loading API: `startLoading`, `endLoading`

#### 3) Imperative API (outside React)

`app/react/V2/utils/notifyBridge.ts`

Use this from non-React modules (for example, socket handlers):

- `notify(title, type, message?, details?)`
- `setConnected(connected)`
- `registerTask(id, label)`
- `endTask(id, finalStatus?)`
- plus re-exported `startLoading` / `endLoading`

Note: bridge maps legacy `danger` to new `error`.

---

### UI components

Folder: `app/react/V2/Components/UI/Notifications/`

- `RequestStatus.tsx`
  - orchestrator mounted in top menu
  - renders:
    - transient `NotificationFlash` for latest error/warning
    - `StatusDot` in top bar
    - `NotificationsPanel` (sidepanel)
- `StatusDot.tsx`
  - status dot, loading dots animation, running-task spinner, disconnected icon
- `NotificationsPanel.tsx`
  - sidepanel sections for `Tasks` and `Notifications`
- `TaskItem.tsx`
  - task label + status + progress bar
- `NotificationItem.tsx`
  - notification entry with optional message/details and timestamp
- `NotificationFlash.tsx`
  - animated small flash title for warning/error

Exports: `app/react/V2/Components/UI/Notifications/index.ts`

---

### Top bar integration point

`app/react/App/Menu.tsx` imports and renders `<RequestStatus />` in desktop menu.

---

### Contrast-aware color support (new)

To support instances with different top bar colors:

- Hook: `app/react/V2/CustomHooks/useContrastColor.ts`
- Utils: `app/react/V2/utils/contrastColor.ts`

Behavior:

- walks up ancestors until it finds a non-transparent background
- computes luminance/contrast
- returns `'white' | 'black'`
- updates on ancestor `class`/`style` changes via `MutationObserver`

Current usage:

- `RequestStatus.tsx` computes `contrastColor`
- passes `color={contrastColor}` to:
  - `NotificationFlash`
  - `StatusDot` (loading dots + spinner)

Specs:

- `app/react/V2/utils/specs/contrastColor.spec.ts`
- `app/react/V2/CustomHooks/specs/useContrastColor.spec.tsx`

---

### Realtime integrations

#### A) Global sockets (connection + languages)

`app/react/App/sockets.js`

- On disconnect timeout (8s):
  - `setConnected(false)`
  - warning notification via bridge
- On connect after outage:
  - `setConnected(true)`
  - success notification via bridge

Language tasks:

- install flow:
  - start task in UI action: `registerTask('language-install', ...)`
  - complete/fail in socket events:
    - `translationsInstallDone` -> `endTask('language-install', 'completed')`
    - `translationsInstallError` -> `endTask(..., 'failed')` + error notification

- uninstall flow:
  - start task in UI action: `registerTask('language-uninstall', ...)`
  - complete/fail in socket events:
    - `translationsDeleteDone` -> complete
    - `translationsDeleteError` -> failed + error notification

Where task starts are triggered:

- `app/react/V2/Routes/Settings/Languages/components/InstallLanguagesModal.tsx`
- `app/react/V2/Routes/Settings/Languages/LanguagesList.tsx`

#### B) IX realtime progress as tasks

`app/react/V2/Routes/Settings/IX/IXSuggestions.tsx`

Pattern used:

- `registerTask(extractorId, initialLabel, setupListeners)`
- setup listener receives `(update, complete, fail)`
- listens to socket events (`MODEL_STATUS`, `MODEL_ERROR`)
- maps statuses to task label/progress:
  - processing model
  - finding suggestions (`progress`)
  - auto-accept (`progress`)
  - ready -> `complete()`
  - error -> `fail()`

The same file includes two task flows:

- `trainModel(...)`
- `processExtractor(...)`

Related status hook:

- `app/react/V2/Routes/Settings/IX/hooks/useEventHandler.ts`
  - updates IX local status and emits one-off notifications

---

### Task lifecycle model

#### Simple task (imperative)

Use when completion is driven by a separate event source and you only need start/end:

- call `registerTask(id, label)`
- later call `endTask(id, 'completed' | 'failed')`

#### Realtime task with progress

Use when status events can push progress updates:

- call `registerTask(id, label, setupListeners)`
- inside `setupListeners`:
  - call `update({ label?, progress? })`
  - call `complete()` / `fail()`
  - return cleanup function that unsubscribes listeners

Implementation note:

- `requestStatusAtom.ts` stores cleanup callbacks in `taskCleanups` map (outside atom), keyed by task id.
- Re-registering same id first removes previous task and cleanup.

---

### Notification UX rules (current)

- New notifications are appended and marked unread
- Opening panel marks all current notifications as read
- `overallStatus` is based on unread notifications only (plus loading)
- `clearAll()` removes notifications and keeps only running tasks
- panel lists notifications newest-first (reverse order)

Transient flash behavior (`RequestStatus.tsx`):

- only warning/error trigger flash
- flash auto-hides after enter + hold + leave timing
- success/info do not flash; they trigger status-dot pop animation

---

### Recommended usage patterns

#### In React components/hooks

Prefer `useRequestStatus()`:

- `notify('success' | 'warning' | 'error' | 'info', title, message?, details?)`
- `registerTask(...)` for long-running processes

#### In non-React modules

Prefer `notifyBridge`:

- `notifyBridge.notify(...)`
- `notifyBridge.setConnected(...)`
- `notifyBridge.registerTask(...)`
- `notifyBridge.endTask(...)`

#### For new realtime features

Use the IX pattern:

1. start task with stable ID
2. attach listeners in `setupListeners`
3. map backend statuses to `label` + `progress`
4. call `complete/fail`
5. return cleanup unsubscribers

---

### Pitfalls and guardrails

- Do not use legacy `'danger'` in hook API (`notify`): use `'error'`.
  - Bridge accepts `'danger'` only for compatibility and maps it.
- Keep task IDs stable and unique per logical job instance.
  - Reusing IDs intentionally replaces previous task state.
- Always return cleanup in listener-based tasks.
- Prefer `clearAll()` semantics (keeps running tasks) for panel “Empty” actions.
- For top-bar visuals, avoid hardcoded text/dot colors; use the contrast hook result.

---

### Testing and playground

Storybook playground:

- `app/react/stories/RequestStatus.stories.tsx`
- includes controls to:
  - add notifications
  - register/update/end tasks
  - toggle connection/loading
  - test RTL
  - change top bar color via color picker

Notification stories:

- `app/react/stories/NotificationItem.stories.tsx`
- `app/react/stories/NotificationsPanel.stories.tsx`
- `app/react/stories/StatusDot.stories.tsx`

---

### Quick API cheat sheet

#### `useRequestStatus()`

- `notify(type, title, message?, details?, timestamp?)`
- `registerTask(id, label, setupListeners?, initialProgress?)`
- `updateTask(id, updates)`
- `endTask(id, finalStatus?)`
- `removeTask(id)`
- `clearAll()`
- `setConnected(boolean)`
- `togglePanel()`
- `startLoading()` / `endLoading()`

#### `notifyBridge`

- `notify(title, type, message?, details?)`
- `registerTask(id, label)`
- `endTask(id, finalStatus?)`
- `setConnected(boolean)`
- `startLoading()` / `endLoading()`

---

### For AI agents

When modifying notifications:

1. Treat `requestStatusAtom.ts` as source of truth.
2. Prefer additive changes in UI components (`RequestStatus`, `StatusDot`, panel items).
3. If integrating sockets/non-React code, use `notifyBridge`.
4. For long-running backend jobs, implement `registerTask(..., setupListeners)` with cleanup.
5. Preserve unread semantics unless explicitly requested otherwise.
6. Preserve contrast-aware coloring path (`useContrastColor`) for top-bar readability.
7. Add/update Storybook stories when changing UX behavior.
