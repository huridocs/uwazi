import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import { getPublicEmbedData } from '#V2/api/dataviz/index.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

type UseDatavizEmbedDataResult = {
  payload: DatavizEmbedPayload | null;
  loading: boolean;
  error: string | null;
};

const useDatavizEmbedData = (id: string): UseDatavizEmbedDataResult => {
  const locale = useAtomValue(localeAtom);
  const [payload, setPayload] = useState<DatavizEmbedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const result = await getPublicEmbedData(id, locale);

      if (cancelled) {
        return;
      }

      if (result instanceof FetchResponseError) {
        setPayload(null);
        setError(result.message || 'Unable to load visualization');
        setLoading(false);
        return;
      }

      setPayload(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  return { payload, loading, error };
};

export { useDatavizEmbedData };
