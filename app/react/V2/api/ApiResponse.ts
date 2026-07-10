import type { ApiError } from '#shared/apiClient/index.js';

type ApiResponse<T, E = ApiError> = [T, E?];

export type { ApiResponse };
