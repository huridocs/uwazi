import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom, userAtom } from '#V2/atoms/index.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';
import { DatavizLoadingIndicator } from '#V2/Dataviz/components/DatavizLoadingIndicator.js';
import { getPublicEmbedData } from '#V2/api/dataviz/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

declare global {
  interface Window {
    __datavizEmbedPayload__?: DatavizEmbedPayload;
  }
}

const readInitialPayload = (): DatavizEmbedPayload | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.__datavizEmbedPayload__ ?? null;
};

const DatavizEmbedRoute = () => {
  const { id } = useParams();
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const locale = useAtomValue(localeAtom);
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private });
  const isAuthenticated = Boolean(user?._id);

  const [payload, setPayload] = useState<DatavizEmbedPayload | null>(readInitialPayload);
  const [loading, setLoading] = useState(() => !readInitialPayload());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || payload) {
      return undefined;
    }

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
  }, [id, locale, payload]);

  if (!id) {
    return null;
  }

  if (!externalEmbedAllowed && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-ink-secondary">
          Embedding is not available on private instances.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4">
        <DatavizLoadingIndicator />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-paper p-4">
        <p className="text-sm text-ink-secondary">No visualization data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-4">
      <DatavizEmbed payload={payload} />
    </div>
  );
};

export { DatavizEmbedRoute };
