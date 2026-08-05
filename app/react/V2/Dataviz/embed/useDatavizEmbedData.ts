import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import { getPublicEmbedData } from '#V2/api/dataviz/index.js';
import type { DatavizEmbedPayload, DatavizRuntimeFilter } from '#shared/types/datavizSchema.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

const REFRESH_DEBOUNCE_MS = 150;

type UseDatavizEmbedDataResult = {
  payload: DatavizEmbedPayload | null;
  /** First load with no data yet. */
  initialLoading: boolean;
  /** Refetch in progress; previous payload is kept for smooth updates. */
  refreshing: boolean;
  error: string | null;
};

const useDatavizEmbedData = (
  id: string,
  externalFilters?: DatavizRuntimeFilter[]
): UseDatavizEmbedDataResult => {
  const locale = useAtomValue(localeAtom);
  const [payload, setPayload] = useState<DatavizEmbedPayload | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const payloadRef = useRef<DatavizEmbedPayload | null>(null);
  payloadRef.current = payload;

  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async (currentRequest: number) => {
      const hasPayload = payloadRef.current !== null;
      if (hasPayload) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);

      const result = await getPublicEmbedData(id, locale, externalFilters);

      if (cancelled || currentRequest !== requestId.current) {
        return;
      }

      if (result instanceof FetchResponseError) {
        if (!hasPayload) {
          setPayload(null);
        }
        setError(result.message || 'Unable to load visualization');
        setInitialLoading(false);
        setRefreshing(false);
        return;
      }

      setPayload(result);
      setError(null);
      setInitialLoading(false);
      setRefreshing(false);
    };

    requestId.current += 1;
    const currentRequest = requestId.current;

    debounceTimer = setTimeout(() => {
      load(currentRequest).catch(() => {
        if (cancelled || currentRequest !== requestId.current) {
          return;
        }
        if (!payloadRef.current) {
          setPayload(null);
        }
        setError('Unable to load visualization');
        setInitialLoading(false);
        setRefreshing(false);
      });
    }, REFRESH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [id, locale, JSON.stringify(externalFilters ?? [])]);

  return { payload, initialLoading, refreshing, error };
};

export { useDatavizEmbedData };
