import { useEffect, useMemo, useRef, useState } from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { useDatavizApi } from '#V2/Dataviz/api/DatavizApiContext.js';
import { isPreviewQueryReady } from '#V2/Dataviz/utils/isPreviewQueryReady.js';
import { buildPreviewFetchKey } from '#V2/Dataviz/utils/buildPreviewFetchKey.js';
import {
  buildManualDataDTO,
  isManualDataSource,
  parseManualDataPayload,
} from '#shared/dataviz/manualData.js';

const PREVIEW_DEBOUNCE_MS = 300;

type PreviewState = {
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  queryDurationMs?: number;
};

type PreviewFetchInput = Pick<DatavizDefinition, 'id' | 'query'>;

const useDatavizPreview = (definition: DatavizDefinition) => {
  const api = useDatavizApi();
  const { id, query, manualData, dataSource } = definition;
  const isManual = isManualDataSource(dataSource);
  const [state, setState] = useState<PreviewState>({
    data: null,
    loading: true,
    error: null,
  });
  const requestId = useRef(0);
  const fetchInputRef = useRef<PreviewFetchInput>({ id, query });
  fetchInputRef.current = { id, query };

  const previewFetchKey = useMemo(
    () =>
      isManual
        ? `${id}:manual:${JSON.stringify(manualData ?? null)}`
        : buildPreviewFetchKey(id, query),
    [id, query, isManual, manualData]
  );

  const fetchPreview = (currentRequest: number, input: PreviewFetchInput) => {
    const startedAt = performance.now();

    return api
      .getData(input)
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
    if (isManual) {
      const currentRequest = ++requestId.current;
      setState(prev => ({ ...prev, loading: true, error: null }));

      const timer = setTimeout(() => {
        if (currentRequest !== requestId.current) return;
        try {
          parseManualDataPayload(manualData ?? {});
          setState({
            data: buildManualDataDTO(id, manualData),
            loading: false,
            error: null,
          });
        } catch (error) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Invalid manual data',
          });
        }
      }, PREVIEW_DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }

    const input = fetchInputRef.current;

    if (!isPreviewQueryReady(input.query)) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    const currentRequest = ++requestId.current;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(() => {
      fetchPreview(currentRequest, fetchInputRef.current);
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [api, previewFetchKey, id, isManual, manualData]);

  const refresh = () => {
    if (isManual) {
      try {
        parseManualDataPayload(manualData ?? {});
        setState({
          data: buildManualDataDTO(id, manualData),
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Invalid manual data',
        });
      }
      return;
    }

    if (!isPreviewQueryReady(query)) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const currentRequest = ++requestId.current;
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchPreview(currentRequest, { id, query });
  };

  return { ...state, refresh };
};

export { useDatavizPreview };
