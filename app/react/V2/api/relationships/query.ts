import { IncomingHttpHeaders } from 'http';
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '../client.js';
import { requestHeaders } from '../requestHeaders.js';
import { ApiResponse } from '../ApiResponse.js';
import type {
  RelationshipAnchor,
  RelationshipResolved,
  RelationshipSummary,
  SelectionRect,
} from './types.js';

const withLanguage = (language: string, headers?: IncomingHttpHeaders) => ({
  ...requestHeaders(headers),
  'Content-Language': language,
});

type RowsBody = { rows?: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSelectionRect = (value: unknown): value is SelectionRect =>
  isRecord(value) &&
  typeof value.top === 'number' &&
  typeof value.left === 'number' &&
  typeof value.width === 'number' &&
  typeof value.height === 'number' &&
  typeof value.page === 'string';

const toSummaryRow = (value: unknown): RelationshipSummary | undefined => {
  if (!isRecord(value) || !isRecord(value.entityData)) return undefined;
  if (typeof value._id !== 'string' || typeof value.hub !== 'string') return undefined;
  if (typeof value.entity !== 'string') return undefined;
  if (value.template !== null && typeof value.template !== 'string') return undefined;
  if (value.file !== undefined && typeof value.file !== 'string') return undefined;
  if (typeof value.entityData.title !== 'string') return undefined;
  if (typeof value.entityData.template !== 'string') return undefined;
  return {
    _id: value._id,
    hub: value.hub,
    entity: value.entity,
    template: value.template,
    ...(value.file ? { file: value.file } : {}),
    entityData: { title: value.entityData.title, template: value.entityData.template },
  };
};

const toAnchorRow = (value: unknown): RelationshipAnchor | undefined => {
  if (!isRecord(value) || typeof value._id !== 'string' || !isRecord(value.reference)) {
    return undefined;
  }
  const rects = value.reference.selectionRectangles;
  if (!Array.isArray(rects) || !isSelectionRect(rects[0])) return undefined;
  const first: SelectionRect = rects[0];
  return { _id: value._id, reference: { selectionRectangles: [first] } };
};

const toResolvedRow = (value: unknown): RelationshipResolved | undefined => {
  if (!isRecord(value) || typeof value._id !== 'string' || !isRecord(value.reference)) {
    return undefined;
  }
  if (
    typeof value.reference.text !== 'string' ||
    !Array.isArray(value.reference.selectionRectangles)
  ) {
    return undefined;
  }
  const selectionRectangles = value.reference.selectionRectangles.filter(isSelectionRect);
  if (selectionRectangles.length !== value.reference.selectionRectangles.length) return undefined;
  return {
    _id: value._id,
    reference: { text: value.reference.text, selectionRectangles },
  };
};

const emptyOnHttp404 = (error: ApiError | undefined): boolean =>
  Boolean(error && error.kind === 'http' && error.status === 404);

type GetRowsOptions<T> = {
  path: string;
  query: Record<string, string>;
  language: string;
  headers?: IncomingHttpHeaders;
  parse: (value: unknown) => T | undefined;
};

const getRows = async <T>({
  path,
  query,
  language,
  headers,
  parse,
}: GetRowsOptions<T>): Promise<ApiResponse<T[] | undefined>> => {
  const [data, error] = await apiClient.getJson<RowsBody>(path, query, {
    headers: withLanguage(language, headers),
    language,
  });

  if (emptyOnHttp404(error)) {
    return [[]];
  }
  if (error) {
    return [undefined, error];
  }

  const rows = Array.isArray(data?.rows)
    ? data.rows.flatMap(row => {
        const parsed = parse(row);
        return parsed ? [parsed] : [];
      })
    : [];
  return [rows];
};

const getSummary = async (
  sharedId: string,
  language: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<RelationshipSummary[] | undefined>> =>
  getRows({
    path: 'relationships/summary',
    query: { sharedId },
    language,
    headers,
    parse: toSummaryRow,
  });

const getAnchors = async (
  sharedId: string,
  fileId: string,
  language: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<RelationshipAnchor[] | undefined>> =>
  getRows({
    path: 'relationships/anchors',
    query: { sharedId, file: fileId },
    language,
    headers,
    parse: toAnchorRow,
  });

const getResolved = async (
  sharedId: string,
  language: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<RelationshipResolved[] | undefined>> =>
  getRows({
    path: 'relationships/resolved',
    query: { sharedId },
    language,
    headers,
    parse: toResolvedRow,
  });

export { getSummary, getAnchors, getResolved };
