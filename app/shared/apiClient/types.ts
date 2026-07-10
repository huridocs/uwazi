import type { ApiError } from './ApiError.js';
import type { ApiClientEventBus, RequestPolicies } from './ApiClientEventBus.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { UploadProgressEvent } from './transport/types.js';

type ApiResponse<T, E = ApiError> = [T, E?];

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

type JsonResponseBody = Record<string, unknown>;

type JsonResponse = {
  json: JsonResponseBody;
  status: number;
  cookie?: string;
  headers: Headers;
  endpoint: { method: HttpMethod; url: string };
  ok?: boolean;
  message?: string;
};

type RequestContext = {
  headers?: Record<string, string>;
  language?: string;
  signal?: AbortSignal;
  cookie?: string;
  onUploadProgress?: (event: UploadProgressEvent) => void;
  retry?: false | Partial<RetryPolicy>;
  policies?: RequestPolicies;
};

type ApiClientConfig = {
  baseUrl: string;
  language?: string;
  cookie?: string;
  retryPolicy?: Partial<RetryPolicy>;
  eventBus?: ApiClientEventBus;
  retry?: boolean;
};

export type {
  ApiResponse,
  ApiClientConfig,
  HttpMethod,
  JsonResponse,
  JsonResponseBody,
  RequestContext,
};
export type {
  MultipartField,
  MultipartFilePart,
  MultipartPayload,
  UploadProgressEvent,
} from './transport/types.js';
