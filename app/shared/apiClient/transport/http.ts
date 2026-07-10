import 'isomorphic-fetch';
import {
  buildJsonRequest,
  buildMultipartFormData,
  DEFAULT_JSON_HEADERS,
  mergeHeaders,
} from './request.js';
import {
  assertTransportSuccess,
  readFetchBody,
  readHeadBody,
  readResponseText,
} from './response.js';
import type {
  JsonTransportInput,
  MultipartTransportInput,
  TransportContext,
  TransportEndpoint,
  TransportSuccess,
  UploadProgressEvent,
} from './types.js';

type XhrTransportInput = {
  url: string;
  method: string;
  body: FormData | BodyInit | null;
  endpoint: TransportEndpoint;
  context?: TransportContext;
};

type XhrHandlers = {
  xhr: XMLHttpRequest;
  endpoint: TransportEndpoint;
  cleanup: () => void;
  resolve: (value: TransportSuccess) => void;
  reject: (reason: Error) => void;
};

const fetchJson = async (input: JsonTransportInput): Promise<TransportSuccess> => {
  const { url, method, query, body, context = {} } = input;
  const endpoint = { method, url };
  const { url: requestUrl, init } = buildJsonRequest({ url, method, query, body, context });
  const response = await fetch(requestUrl, init);

  return assertTransportSuccess(
    response.status,
    response.statusText,
    response.headers,
    method === 'HEAD' ? readHeadBody() : await readFetchBody(response),
    endpoint,
    response.headers.get('set-cookie') ?? undefined
  );
};

const parseXhrHeaders = (raw: string): Headers => {
  const map = new Map<string, string>();
  raw
    .trim()
    .split(/[\r\n]+/)
    .forEach(line => {
      const index = line.indexOf(':');
      if (index > 0) {
        map.set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
      }
    });

  if (typeof Headers !== 'undefined') {
    const headers = new Headers();
    map.forEach((value, key) => {
      headers.set(key, value);
    });
    return headers;
  }

  return { get: (name: string) => map.get(name.toLowerCase()) ?? null } as Headers;
};

const wireUploadProgress = (xhr: XMLHttpRequest, context: TransportContext) => {
  if (!context.onUploadProgress) return;

  xhr.upload.addEventListener('progress', event => {
    if (!event.lengthComputable) return;

    const percent = event.total > 0 ? (event.loaded / event.total) * 100 : undefined;
    const progress: UploadProgressEvent = {
      loaded: event.loaded,
      total: event.total,
      percent,
    };
    context.onUploadProgress?.(progress);
  });
};

const wireAbortCleanup = (xhr: XMLHttpRequest, signal?: AbortSignal) => {
  const onAbort = () => {
    xhr.abort();
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  return () => {
    signal?.removeEventListener('abort', onAbort);
  };
};

const resolveXhrResponse = (xhr: XMLHttpRequest, endpoint: TransportEndpoint): TransportSuccess => {
  const responseHeaders = parseXhrHeaders(xhr.getAllResponseHeaders());
  const contentType = responseHeaders.get('Content-Type') ?? '';
  return assertTransportSuccess(
    xhr.status,
    xhr.statusText,
    responseHeaders,
    readResponseText(xhr.responseText, contentType, xhr.status),
    endpoint
  );
};

/* eslint-disable no-param-reassign -- xhr lifecycle handlers */
const bindXhrEvents = ({ xhr, endpoint, cleanup, resolve, reject }: XhrHandlers) => {
  xhr.onload = () => {
    try {
      cleanup();
      resolve(resolveXhrResponse(xhr, endpoint));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
  xhr.onerror = () => {
    cleanup();
    reject(new TypeError('Network request failed'));
  };
  xhr.onabort = () => {
    cleanup();
    const error = new Error('Request aborted');
    error.name = 'AbortError';
    reject(error);
  };
};
/* eslint-enable no-param-reassign */

const xhrTransport = async (input: XhrTransportInput): Promise<TransportSuccess> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const context = input.context ?? {};
    const headers = mergeHeaders(DEFAULT_JSON_HEADERS, context.headers, context.cookie);

    xhr.open(input.method, input.url, true);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    wireUploadProgress(xhr, context);

    const cleanup = wireAbortCleanup(xhr, context.signal);
    bindXhrEvents({ xhr, endpoint: input.endpoint, cleanup, resolve, reject });
    xhr.send(input.body as XMLHttpRequestBodyInit);
  });

const fetchMultipart = async (input: MultipartTransportInput): Promise<TransportSuccess> => {
  const { url, method = 'POST', payload, context = {} } = input;
  return xhrTransport({
    url,
    method,
    body: buildMultipartFormData(payload),
    endpoint: { method, url },
    context,
  });
};

export { fetchJson, fetchMultipart };
