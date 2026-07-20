import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';
import { useDatavizEmbedData } from '#V2/Dataviz/embed/useDatavizEmbedData.js';
import { useDatavizRuntimeFilters } from '#V2/Dataviz/embed/useDatavizRuntimeFilters.js';
import { DatavizLoadingIndicator } from '#V2/Dataviz/components/DatavizLoadingIndicator.js';

type DatavizEmbedByIdProps = {
  id: string;
  height?: number;
};

const DatavizEmbedById = ({ id, height }: DatavizEmbedByIdProps) => {
  const externalFilters = useDatavizRuntimeFilters(id);
  const { payload, initialLoading, refreshing, error } = useDatavizEmbedData(id, externalFilters);

  if (initialLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <DatavizLoadingIndicator />
      </div>
    );
  }

  if (error && !payload) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!payload) {
    return (
      <p className="text-sm text-ink-secondary">
        <Translate>No visualization data available.</Translate>
      </p>
    );
  }

  return (
    <div className="relative">
      {refreshing && (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-paper/40 transition-opacity"
          aria-hidden
        />
      )}
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <DatavizEmbed payload={payload} height={height} animateUpdates />
    </div>
  );
};

export { DatavizEmbedById };
