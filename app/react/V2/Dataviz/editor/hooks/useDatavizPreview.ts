import { useEffect, useRef, useState } from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { useDatavizApi } from '#V2/Dataviz/api/DatavizApiContext.js';

const PREVIEW_DEBOUNCE_MS = 300;

type PreviewState = {
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  queryDurationMs?: number;
};

const useDatavizPreview = (definition: DatavizDefinition) => {
  const api = useDatavizApi();
  const [state, setState] = useState<PreviewState>({
    data: null,
    loading: true,
    error: null,
  });
  const requestId = useRef(0);

  const fetchPreview = (currentRequest: number) => {
    const startedAt = performance.now();

    return api
      .getData(definition)
      .then(data => {
        if (currentRequest !== requestId.current) return;
        setState({
          data,
          loading: false,
          error: null,
          queryDurationMs: Math.round(performance.now() - startedAt),
        });
      })
      .catch(err => {
        if (currentRequest !== requestId.current) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load preview data',
          queryDurationMs: Math.round(performance.now() - startedAt),
        });
      });
  };

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(() => {
      fetchPreview(currentRequest);
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [api, definition]);

  const refresh = () => {
    const currentRequest = ++requestId.current;
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchPreview(currentRequest);
  };

  return { ...state, refresh };
};

export { useDatavizPreview };
