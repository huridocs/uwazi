import type { HttpMethod } from '../types.js';

type UploadProgressEvent = {
  loaded: number;
  total?: number;
  percent?: number;
};

type TransportEndpoint = {
  method: HttpMethod;
  url: string;
};

type TransportContext = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cookie?: string;
  onUploadProgress?: (event: UploadProgressEvent) => void;
};

type MultipartField = {
  name: string;
  value: string;
};

type MultipartFilePart = {
  name: string;
  file: Blob;
  filename?: string;
};

type MultipartPayload = {
  fields?: MultipartField[];
  files?: MultipartFilePart[];
};

type JsonTransportInput = {
  url: string;
  method: HttpMethod;
  query?: unknown;
  body?: unknown;
  context?: TransportContext;
};

type MultipartTransportInput = {
  url: string;
  method?: 'POST' | 'PUT';
  payload: MultipartPayload;
  context?: TransportContext;
};

type TransportSuccess = {
  body: Record<string, unknown> | unknown[];
  status: number;
  headers: Headers;
  setCookie?: string;
  endpoint: TransportEndpoint;
};

export type {
  JsonTransportInput,
  MultipartField,
  MultipartFilePart,
  MultipartPayload,
  MultipartTransportInput,
  TransportContext,
  TransportEndpoint,
  TransportSuccess,
  UploadProgressEvent,
};
