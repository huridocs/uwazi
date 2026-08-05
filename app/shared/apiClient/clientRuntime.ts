import { createRequestId, executeWithRetry } from './executeWithRetry.js';
import { mergeRetryPolicy } from './retryPolicy.js';
import { fetchJson, fetchMultipart } from './transport/http.js';
import { hasRequestBody, isQueryMethod } from './transport/request.js';
import type { ApiClientConfig, RequestContext } from './types.js';
import type { MultipartPayload, TransportContext, TransportSuccess } from './transport/types.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { ApiClientEventBus } from './ApiClientEventBus.js';

type ClientRuntime = {
  getBaseUrl: () => string;
  setBaseUrl: (url: string) => void;
  setLanguage: (language: string) => void;
  setCookie: (cookie: string) => void;
  eventBus?: ApiClientEventBus;
  buildTransportContext: (
    ctx: RequestContext | undefined,
    signal: AbortSignal | undefined,
    uploadRequestId?: string
  ) => TransportContext;
  resolvePolicy: (ctx?: RequestContext) => RetryPolicy;
};

const createClientRuntime = (config: ApiClientConfig): ClientRuntime => {
  let { baseUrl } = config;
  let defaultLanguage = config.language;
  let clientCookie = config.cookie;
  const clientPolicy = mergeRetryPolicy(config.retryPolicy);
  const { eventBus } = config;
  const clientRetryEnabled = config.retry !== false;

  const buildHeaders = (ctx?: RequestContext) => {
    const headers: Record<string, string> = { ...(ctx?.headers ?? {}) };
    const hasContentLanguage = Object.keys(headers).some(
      key => key.toLowerCase() === 'content-language'
    );
    const requestLanguage = ctx?.language ?? defaultLanguage;
    if (requestLanguage && !hasContentLanguage) headers['Content-Language'] = requestLanguage;
    return headers;
  };

  const buildTransportContext = (
    ctx: RequestContext | undefined,
    signal: AbortSignal | undefined,
    uploadRequestId?: string
  ): TransportContext => ({
    headers: buildHeaders(ctx),
    signal,
    cookie: ctx?.cookie ?? clientCookie,
    onUploadProgress: event => {
      ctx?.onUploadProgress?.(event);
      if (uploadRequestId && event.percent !== undefined) {
        eventBus?.emit({ type: 'upload:progress', id: uploadRequestId, percent: event.percent });
      }
    },
  });

  const resolvePolicy = (ctx?: RequestContext): RetryPolicy => {
    if (!clientRetryEnabled || ctx?.retry === false) {
      return { ...clientPolicy, maxAttempts: 1 };
    }
    if (ctx?.retry && typeof ctx.retry === 'object') {
      return mergeRetryPolicy(clientPolicy, ctx.retry);
    }
    return clientPolicy;
  };

  return {
    getBaseUrl: () => baseUrl,
    setBaseUrl: url => {
      baseUrl = url;
    },
    setLanguage: value => {
      defaultLanguage = value;
    },
    setCookie: value => {
      clientCookie = value;
    },
    eventBus,
    buildTransportContext,
    resolvePolicy,
  };
};

const runJsonRequest = async (
  runtime: ClientRuntime,
  path: string,
  data: unknown,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
  ctx?: RequestContext
  // eslint-disable-next-line max-params
): Promise<TransportSuccess> => {
  const url = `${runtime.getBaseUrl()}${path}`;
  return executeWithRetry({
    method,
    path,
    url,
    policy: runtime.resolvePolicy(ctx),
    signal: ctx?.signal,
    eventBus: runtime.eventBus,
    policies: ctx?.policies,
    fn: async signal =>
      fetchJson({
        url,
        method,
        query: isQueryMethod(method) ? data : undefined,
        body: hasRequestBody(method) ? data : undefined,
        context: runtime.buildTransportContext(ctx, signal),
      }),
  });
};

const runMultipartRequest = async (
  runtime: ClientRuntime,
  path: string,
  payload: MultipartPayload,
  ctx?: RequestContext
): Promise<TransportSuccess> => {
  const url = `${runtime.getBaseUrl()}${path}`;
  const requestId = createRequestId();
  return executeWithRetry({
    method: 'POST',
    path,
    url,
    policy: runtime.resolvePolicy({ ...ctx, retry: false }),
    signal: ctx?.signal,
    eventBus: runtime.eventBus,
    requestId,
    policies: ctx?.policies,
    fn: async signal =>
      fetchMultipart({
        url,
        payload,
        context: runtime.buildTransportContext(ctx, signal, requestId),
      }),
  });
};

export { createClientRuntime, runJsonRequest, runMultipartRequest };
export type { ClientRuntime };
