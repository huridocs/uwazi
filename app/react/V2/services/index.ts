/**
 * V2 Services layer — domain facades between routes and `#V2/api`.
 *
 * ## Loaders (SSR + client navigation)
 *
 * Loaders run outside React and cannot use Context. Import the production singleton
 * and pass an optional override to the loader factory in tests:
 *
 * ```ts
 * import { services, type V2Services } from '#V2/services/index.js';
 *
 * export const createThesauriLoader =
 *   (svc: V2Services = services) =>
 *   (headers?: IncomingHttpHeaders): LoaderFunction =>
 *   async () => {
 *     const [data, error] = await svc.thesauri.list({ headers });
 *     if (error) throw error;
 *     return data;
 *   };
 *
 * export const thesauriLoader = createThesauriLoader();
 * ```
 *
 * ## Component mutations (client only)
 *
 * Wrap the app (or test tree) with `ServicesProvider` and call domain methods via
 * `useServices()` / `useServiceMutation`. Revalidate loader data with `useRevalidator()`
 * after successful writes.
 *
 * ## Tests
 *
 * - Loader / full route: `createTestServices({ thesauri: { list: mock } })` +
 *   `createThesauriLoader(testServices)({})` on the router.
 * - Component only: `<ServicesProvider value={testServices}>`.
 * - Import test helpers from `#V2/testing/createTestServices.js` and
 *   `#V2/testing/renderRoute.js` (not the `testing/index` barrel) so existing
 *   specs that import `TestAtomStoreProvider` do not load the services layer.
 */
import { services } from './singleton.js';
import { createDefaultServices } from './createDefaultServices.js';

export { services, createDefaultServices };
export { ServicesProvider, useServices } from './ServicesProvider.js';
export type { V2Services, DeepPartial } from './types.js';
export type { ThesaurusService } from './thesauri/ThesaurusService.js';
export type { UsersService } from './users/UsersService.js';
