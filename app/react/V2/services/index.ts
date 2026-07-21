/**
 * V2 Services layer — domain facades between routes and `#V2/api`.
 *
 * ## Loaders (SSR + client navigation)
 *
 * Loaders run outside React and cannot use Context. Import the default `services`
 * instance and pass an optional override to the loader factory in tests:
 *
 * ```ts
 * import { httpServices } from '#V2/services/http/index.js';
 * import type { V2Services } from '#V2/services/types.js';
 *
 * // Wiring layer (Routes.tsx / entry-server) — default HTTP on client, server adapters in SSR:
 * const getRoutes = (..., services: V2Services = httpServices) => (
 *   <Route loader={createThesauriLoader(services)(headers)} />
 * );
 *
 * // entry-server.tsx (SSR in-process adapters):
 * import { createServerServices } from '#V2/services/server/index.js';
 * const services = createServerServices(req);
 * const routes = getRoutes(settings, userId, headers, indexComponents, services);
 *
 * // Loader factory — no default; services always injected by wiring above:
 * export const thesauriLoader = createThesauriLoader(services);
 * ```
 *
 * ## Component mutations (client only)
 *
 * Wrap the app (or test tree) with `ServicesProvider` and call domain methods via
 * `useServices()`. Services return `ApiResponse` tuples — handle `[data, error]` in the
 * handler (`useRequestStatus` for toasts, `useRevalidator()` after success).
 *
 * ## Tests
 *
 * - Loader / full route: `createTestServices({ thesauri: { getAll: mock } })` +
 *   `createThesauriLoader(testServices)({})` on the router.
 * - Component only: `<ServicesProvider value={testServices}>`.
 * - Import test helpers from `#V2/testing/createTestServices.js` and
 *   `#V2/testing/renderRoute.js` (not the `testing/index` barrel) so existing
 *   specs that import `TestAtomStoreProvider` do not load the services layer.
 */
export { httpServices as services } from './http/index.js';
export { ServicesProvider, useServices } from './ServicesProvider.js';
export type { V2Services } from './types.js';
export type { EntitiesService, EntitySaveInput } from './contracts/EntitiesService.js';
export type { ThesaurusService, ThesaurusInput } from './contracts/ThesaurusService.js';
export type { Thesaurus } from '#shared/contracts/Thesaurus.js';
export type { UsersService, UserInput } from './contracts/UsersService.js';
export type { User, UserGroup } from '#shared/contracts/Users.js';
export type { UserGroupsService, UserGroupInput } from './contracts/UserGroupsService.js';
export type { ServiceRequestOptions } from './contracts/ServiceRequestOptions.js';
