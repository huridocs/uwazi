/**
 * V2-only API client instance (#9328 / #9284).
 */
import { APIURL } from '#app/config.js';
import { ApiClientEventBus, createApiClient } from '#shared/apiClient/index.js';
import { wireBrowserPolicies } from './policies.js';

const eventBus = new ApiClientEventBus();
const apiClient = createApiClient({ baseUrl: APIURL, eventBus });
wireBrowserPolicies(eventBus);

export { apiClient };
