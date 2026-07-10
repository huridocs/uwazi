import rison from '@huridocs/rison';
import type { HttpMethod } from '../types.js';
import type { MultipartPayload, TransportContext } from './types.js';

const DEFAULT_JSON_HEADERS: Record<string, string> = {
  Accept: 'application/json, application/problem+json',
  'X-Requested-With': 'XMLHttpRequest',
};

type JsonRequestBuildInput = {
  url: string;
  method: HttpMethod;
  query: unknown;
  body: unknown;
  context?: TransportContext;
};

const hasRequestBody = (method: string) =>
  method === 'POST' || method === 'PUT' || method === 'PATCH';

const isQueryMethod = (method: string) =>
  method === 'GET' || method === 'DELETE' || method === 'HEAD';

const mergeHeaders = (
  base: Record<string, string>,
  extra?: Record<string, string>,
  cookie?: string
): Record<string, string> => {
  const headers = { ...base, ...extra };
  if (cookie) headers.Cookie = cookie;
  Object.keys(headers).forEach(key => {
    if (headers[key] === undefined) delete headers[key];
  });
  return headers;
};

const attemptURIEncode = (value: string) => {
  try {
    return encodeURIComponent(value);
  } catch {
    return value;
  }
};

const attemptRisonDecode = (value: string) => {
  // eslint-disable-next-line new-cap
  const risonParser = new rison.parser((e: Error) => {
    throw Error(`rison decoder error: ${e}`);
  });
  risonParser.parse(value);
};

const encodeRisonQueryValue = (serialized: string) => {
  try {
    attemptRisonDecode(serialized);
    return serialized;
  } catch {
    return attemptURIEncode(serialized);
  }
};

const encodeQueryParam = (key: string, value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;

  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const encodedValue =
    encodeURIComponent(key) === 'q'
      ? encodeRisonQueryValue(serialized)
      : attemptURIEncode(serialized);

  return `${encodeURIComponent(key)}=${encodedValue}`;
};

const toUrlParams = (data: unknown): string => {
  if (typeof data === 'string') return `?${data}`;
  if (!data || typeof data !== 'object') return '';

  const params = { ...(data as Record<string, unknown>) };
  if (Object.keys(params).length === 0) return '';

  return `?${Object.keys(params)
    .map(key => encodeQueryParam(key, params[key]))
    .filter((param): param is string => Boolean(param))
    .join('&')}`;
};

const appendQuery = (url: string, query: unknown) => {
  const params = toUrlParams(query);
  return params ? `${url}${params}` : url;
};

const buildJsonRequest = ({ url, method, query, body, context = {} }: JsonRequestBuildInput) => {
  const finalUrl = isQueryMethod(method) ? appendQuery(url, query) : url;
  const headers = mergeHeaders(DEFAULT_JSON_HEADERS, context.headers, context.cookie);

  let requestBody: BodyInit | undefined;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    requestBody = body;
  } else if (hasRequestBody(method) && body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  return {
    url: finalUrl,
    init: {
      method,
      headers,
      credentials: 'same-origin' as RequestCredentials,
      body: requestBody,
      signal: context.signal,
    },
  };
};

const buildMultipartFormData = (payload: MultipartPayload): FormData => {
  const form = new FormData();
  payload.fields?.forEach(field => form.append(field.name, field.value));
  payload.files?.forEach(part => {
    const filename = part.filename ?? (part.file instanceof File ? part.file.name : 'file');
    form.append(part.name, part.file, filename);
  });
  return form;
};

export {
  DEFAULT_JSON_HEADERS,
  buildJsonRequest,
  buildMultipartFormData,
  hasRequestBody,
  isQueryMethod,
  mergeHeaders,
};
