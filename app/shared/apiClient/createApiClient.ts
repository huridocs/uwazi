import { ApiError } from './ApiError.js';
import { createClientRuntime, runJsonRequest, runMultipartRequest } from './clientRuntime.js';
import { toApiError } from './normalizeError.js';
import type { ApiClientConfig, ApiResponse, JsonResponse, RequestContext } from './types.js';
import type { MultipartPayload, TransportSuccess } from './transport/types.js';

const catchAsApiResponse = async <T>(fn: () => Promise<T>): Promise<ApiResponse<T, ApiError>> => {
  try {
    return [await fn()];
  } catch (e) {
    if (e instanceof ApiError) return [undefined as T, e];
    return [undefined as T, toApiError(e)];
  }
};

type ApiClient = {
  getJson: <T>(path: string, query?: unknown, ctx?: RequestContext) => Promise<ApiResponse<T>>;
  postJson: <T>(path: string, body?: unknown, ctx?: RequestContext) => Promise<ApiResponse<T>>;
  putJson: <T>(path: string, body?: unknown, ctx?: RequestContext) => Promise<ApiResponse<T>>;
  deleteJson: <T>(path: string, query?: unknown, ctx?: RequestContext) => Promise<ApiResponse<T>>;
  postMultipart: <T>(
    path: string,
    payload: MultipartPayload,
    ctx?: RequestContext
  ) => Promise<ApiResponse<T>>;
  requestJson: (
    path: string,
    data: unknown,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    ctx?: RequestContext
  ) => Promise<ApiResponse<JsonResponse>>;
  cookie: (value: string) => void;
  locale: (language: string) => void;
  setBaseUrl: (baseUrl: string) => void;
};

const toJsonResponse = (result: TransportSuccess): JsonResponse => ({
  json: result.body,
  status: result.status,
  cookie: result.setCookie,
  headers: result.headers,
  endpoint: result.endpoint,
});

const unwrapJsonBody = <T>(result: ApiResponse<JsonResponse>): ApiResponse<T> => {
  const [response, error] = result;
  if (error || !response) return [undefined as T, error];
  return [response.json as T, error];
};

const unwrapJsonResponse = (result: ApiResponse<TransportSuccess>): ApiResponse<JsonResponse> => {
  const [success, error] = result;
  if (error || !success) return [undefined as unknown as JsonResponse, error];
  return [toJsonResponse(success), error];
};

const createApiClient = (config: ApiClientConfig): ApiClient => {
  const runtime = createClientRuntime(config);

  const requestJson = async (
    path: string,
    data: unknown,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    ctx?: RequestContext
  ) => {
    const result = await catchAsApiResponse(async () =>
      runJsonRequest(runtime, path, data, method, ctx)
    );
    return unwrapJsonResponse(result);
  };

  const postMultipart = async <T>(
    path: string,
    payload: MultipartPayload,
    ctx?: RequestContext
  ) => {
    const result = await catchAsApiResponse(async () =>
      runMultipartRequest(runtime, path, payload, ctx)
    );
    const [success, error] = result;
    if (error || !success) return [undefined as T, error] as ApiResponse<T>;
    return [success.body as T, error] as ApiResponse<T>;
  };

  return {
    getJson: async <T>(path: string, query?: unknown, ctx?: RequestContext) =>
      requestJson(path, query, 'GET', ctx).then(result => unwrapJsonBody<T>(result)),
    postJson: async <T>(path: string, body?: unknown, ctx?: RequestContext) =>
      requestJson(path, body, 'POST', ctx).then(result => unwrapJsonBody<T>(result)),
    putJson: async <T>(path: string, body?: unknown, ctx?: RequestContext) =>
      requestJson(path, body, 'PUT', ctx).then(result => unwrapJsonBody<T>(result)),
    deleteJson: async <T>(path: string, query?: unknown, ctx?: RequestContext) =>
      requestJson(path, query, 'DELETE', ctx).then(result => unwrapJsonBody<T>(result)),
    postMultipart,
    requestJson,
    cookie: runtime.setCookie,
    locale: runtime.setLanguage,
    setBaseUrl: runtime.setBaseUrl,
  };
};

export { createApiClient };
export type { ApiClient };
