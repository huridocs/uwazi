import { useEffect, useMemo } from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { getRefreshModeConstraints } from '#V2/Dataviz/utils/refreshModeConstraints.js';

type UseLiveRefreshGuardInput = {
  definition: DatavizDefinition;
  previewData: DatavizDataDTO | null;
  previewError: string | null;
  previewQueryDurationMs?: number;
  onPatchRefresh: (patch: Partial<DatavizDefinition['refresh']>) => void;
};

const useLiveRefreshGuard = ({
  definition,
  previewData,
  previewError,
  previewQueryDurationMs,
  onPatchRefresh,
}: UseLiveRefreshGuardInput) => {
  const constraints = useMemo(
    () =>
      getRefreshModeConstraints({
        query: definition.query,
        previewMeta: previewData?.meta,
        previewError,
        previewQueryDurationMs,
      }),
    [definition.query, previewData?.meta, previewError, previewQueryDurationMs]
  );

  useEffect(() => {
    if (definition.refresh.refreshMode === 'live' && !constraints.liveAllowed) {
      onPatchRefresh({ refreshMode: 'snapshot_manual' });
    }
  }, [constraints.liveAllowed, definition.refresh.refreshMode, onPatchRefresh]);

  return constraints;
};

export { useLiveRefreshGuard };
