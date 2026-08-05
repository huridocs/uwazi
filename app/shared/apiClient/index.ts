/**
 * Parallel HTTP transport for the V2 stack
 */
export type { ApiResponse, RequestContext } from './types.js';
export { ApiError } from './ApiError.js';
export type { ApiErrorInit, ApiErrorKind, ApiEndpoint, ApiValidation } from './ApiError.js';
export { toApiError } from './normalizeError.js';
export { ApiClientEventBus } from './ApiClientEventBus.js';
export type {
  MultipartField,
  MultipartFilePart,
  MultipartPayload,
  UploadProgressEvent,
} from './types.js';
export { fromLegacyApi } from './fromLegacyApi.js';
export { createApiClient } from '#shared/apiClient/createApiClient.js';
