import {
  getRefreshModeConstraints as getSharedRefreshModeConstraints,
  type RefreshModeBlockReason,
  type RefreshModeConstraints,
  type GetRefreshModeConstraintsInput,
} from '#shared/dataviz/refreshModeConstraints.js';
import {
  REFRESH_LIVE_MAX_ENTITIES,
  REFRESH_LIVE_SLOW_QUERY_MS,
  REFRESH_LIVE_TIMEOUT_MS,
} from '#shared/types/datavizSchema.js';
import { hasTwoDimensions } from './twoDimensionalQuery.js';

export {
  REFRESH_LIVE_MAX_ENTITIES,
  REFRESH_LIVE_SLOW_QUERY_MS,
  REFRESH_LIVE_TIMEOUT_MS,
  type RefreshModeBlockReason,
  type RefreshModeConstraints,
  type GetRefreshModeConstraintsInput,
};

const REASON_MESSAGES: Record<RefreshModeBlockReason, string> = {
  RELATIONSHIP_JOIN: 'Live refresh is not available for relationship joins between templates.',
  MULTI_SOURCE: 'Live refresh is not available when multiple data sources are combined.',
  MULTI_DIMENSION: 'Live refresh is not available for charts with two dimensions.',
  HIGH_ENTITY_COUNT: `Live refresh is not available for more than ${REFRESH_LIVE_MAX_ENTITIES.toLocaleString()} entities.`,
  TRUNCATED_RESULTS:
    'Live refresh is not available when results are truncated. Use a snapshot instead.',
  SLOW_QUERY: `Live refresh is not available when queries take longer than ${REFRESH_LIVE_SLOW_QUERY_MS / 1000}s.`,
  QUERY_TIMEOUT: 'Live refresh is not available after a query timeout.',
  PREVIEW_ERROR: 'Live refresh is not available until preview data loads successfully.',
};

export const getRefreshModeConstraints = (
  input: GetRefreshModeConstraintsInput
): RefreshModeConstraints & { messages: string[] } => {
  const base = getSharedRefreshModeConstraints(input);

  return {
    ...base,
    messages: base.reasons.map(reason => REASON_MESSAGES[reason]),
  };
};

export const getRefreshModeBlockMessage = (reason: RefreshModeBlockReason): string =>
  REASON_MESSAGES[reason];

// re-export for tests that import hasTwoDimensions path
export { hasTwoDimensions };
