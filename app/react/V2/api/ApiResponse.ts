import { FetchResponseError } from '#shared/JSONRequest.js';

type ApiResponse<T, E = FetchResponseError> = [T, E?];

export type { ApiResponse };
