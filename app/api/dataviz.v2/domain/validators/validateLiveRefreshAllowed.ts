import type { DatavizDataMeta, DatavizQuery, RefreshMode } from '#shared/types/datavizSchema.js';
import { getRefreshModeConstraints } from '#shared/dataviz/refreshModeConstraints.js';
import { DatavizLiveNotAllowedError } from '../errors.js';

export const validateLiveRefreshAllowed = (
  refreshMode: RefreshMode,
  query: DatavizQuery,
  previewMeta?: DatavizDataMeta | null
): void => {
  if (refreshMode !== 'live') {
    return;
  }

  const { liveAllowed, reasons } = getRefreshModeConstraints({ query, previewMeta });

  if (!liveAllowed) {
    throw new DatavizLiveNotAllowedError(reasons);
  }
};
