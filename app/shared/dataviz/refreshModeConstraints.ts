import type { DatavizDataMeta, DatavizQuery } from '#shared/types/datavizSchema.js';
import {
  REFRESH_LIVE_MAX_ENTITIES,
  REFRESH_LIVE_SLOW_QUERY_MS,
} from '#shared/types/datavizSchema.js';

export type RefreshModeBlockReason =
  | 'RELATIONSHIP_JOIN'
  | 'MULTI_SOURCE'
  | 'MULTI_DIMENSION'
  | 'HIGH_ENTITY_COUNT'
  | 'TRUNCATED_RESULTS'
  | 'SLOW_QUERY'
  | 'QUERY_TIMEOUT'
  | 'PREVIEW_ERROR';

export type RefreshModeConstraints = {
  liveAllowed: boolean;
  reasons: RefreshModeBlockReason[];
};

export type GetRefreshModeConstraintsInput = {
  query: DatavizQuery;
  previewMeta?: DatavizDataMeta | null;
  previewError?: string | null;
  previewQueryDurationMs?: number;
};

const hasTwoDimensions = (dimensions: DatavizQuery['dimensions']) => dimensions.length >= 2;

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

  const durationMs = Math.max(previewMeta?.queryDurationMs ?? 0, previewQueryDurationMs ?? 0);

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
  const reasons = [...getStructuralConstraints(input.query), ...getEmpiricalConstraints(input)];
  const uniqueReasons = [...new Set(reasons)];

  return {
    liveAllowed: uniqueReasons.length === 0,
    reasons: uniqueReasons,
  };
};
