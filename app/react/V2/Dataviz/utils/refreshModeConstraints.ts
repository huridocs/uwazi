import type { DatavizDataMeta } from '#V2/Dataviz/types/data.js';
import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';
import { hasTwoDimensions } from './twoDimensionalQuery.js';

/** Mirrors §8.1 — backend must enforce the same thresholds on save. */
export const REFRESH_LIVE_MAX_ENTITIES = 10_000;

/** Preview or API-reported duration above this disables Live (§8.1). */
export const REFRESH_LIVE_SLOW_QUERY_MS = 10_000;

/** Documented live query timeout (§7.5); used to detect timeout errors in preview. */
export const REFRESH_LIVE_TIMEOUT_MS = 30_000;

export type RefreshModeBlockReason =
  | 'RELATIONSHIP_JOIN'
  | 'MULTI_SOURCE'
  | 'MULTI_DIMENSION'
  | 'HIGH_ENTITY_COUNT'
  | 'TRUNCATED_RESULTS'
  | 'SLOW_QUERY'
  | 'QUERY_TIMEOUT'
  | 'PREVIEW_ERROR';

const REASON_MESSAGES: Record<RefreshModeBlockReason, string> = {
  RELATIONSHIP_JOIN:
    'Live refresh is not available for relationship joins between templates.',
  MULTI_SOURCE: 'Live refresh is not available when multiple data sources are combined.',
  MULTI_DIMENSION: 'Live refresh is not available for charts with two dimensions.',
  HIGH_ENTITY_COUNT: `Live refresh is not available for more than ${REFRESH_LIVE_MAX_ENTITIES.toLocaleString()} entities.`,
  TRUNCATED_RESULTS:
    'Live refresh is not available when results are truncated. Use a snapshot instead.',
  SLOW_QUERY: `Live refresh is not available when queries take longer than ${REFRESH_LIVE_SLOW_QUERY_MS / 1000}s.`,
  QUERY_TIMEOUT: 'Live refresh is not available after a query timeout.',
  PREVIEW_ERROR: 'Live refresh is not available until preview data loads successfully.',
};

export type RefreshModeConstraints = {
  liveAllowed: boolean;
  reasons: RefreshModeBlockReason[];
  messages: string[];
};

export type GetRefreshModeConstraintsInput = {
  query: DatavizQuery;
  previewMeta?: DatavizDataMeta | null;
  previewError?: string | null;
  previewQueryDurationMs?: number;
};

const isTimeoutError = (error?: string | null) =>
  Boolean(error && /timeout|time.?out|DATAVIZ_QUERY_TIMEOUT/i.test(error));

const getStructuralConstraints = (query: DatavizQuery): RefreshModeBlockReason[] => {
  const reasons: RefreshModeBlockReason[] = [];

  if (query.join?.type === 'relationship') {
    reasons.push('RELATIONSHIP_JOIN');
  }

  if (query.sources.length > 1) {
    reasons.push('MULTI_SOURCE');
  }

  if (hasTwoDimensions(query.dimensions)) {
    reasons.push('MULTI_DIMENSION');
  }

  return reasons;
};

const getEmpiricalConstraints = ({
  previewMeta,
  previewError,
  previewQueryDurationMs,
}: Pick<
  GetRefreshModeConstraintsInput,
  'previewMeta' | 'previewError' | 'previewQueryDurationMs'
>): RefreshModeBlockReason[] => {
  const reasons: RefreshModeBlockReason[] = [];

  if (previewMeta?.totalEntities != null && previewMeta.totalEntities > REFRESH_LIVE_MAX_ENTITIES) {
    reasons.push('HIGH_ENTITY_COUNT');
  }

  if (previewMeta?.truncated) {
    reasons.push('TRUNCATED_RESULTS');
  }

  const durationMs = Math.max(
    previewMeta?.queryDurationMs ?? 0,
    previewQueryDurationMs ?? 0
  );

  if (durationMs >= REFRESH_LIVE_SLOW_QUERY_MS) {
    reasons.push('SLOW_QUERY');
  }

  if (isTimeoutError(previewError)) {
    reasons.push('QUERY_TIMEOUT');
  }

  return reasons;
};

export const getRefreshModeConstraints = (
  input: GetRefreshModeConstraintsInput
): RefreshModeConstraints => {
  const reasons = [
    ...getStructuralConstraints(input.query),
    ...getEmpiricalConstraints(input),
  ];

  const uniqueReasons = [...new Set(reasons)];

  return {
    liveAllowed: uniqueReasons.length === 0,
    reasons: uniqueReasons,
    messages: uniqueReasons.map(reason => REASON_MESSAGES[reason]),
  };
};

export const getRefreshModeBlockMessage = (reason: RefreshModeBlockReason): string =>
  REASON_MESSAGES[reason];
