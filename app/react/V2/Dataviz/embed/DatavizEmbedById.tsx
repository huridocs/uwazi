import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';
import { useDatavizEmbedData } from '#V2/Dataviz/embed/useDatavizEmbedData.js';
import { DatavizLoadingIndicator } from '#V2/Dataviz/components/DatavizLoadingIndicator.js';

type DatavizEmbedByIdProps = {
  id: string;
  height?: number;
};

const DatavizEmbedById = ({ id, height }: DatavizEmbedByIdProps) => {
  const { payload, loading, error } = useDatavizEmbedData(id);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <DatavizLoadingIndicator />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!payload) {
    return (
      <p className="text-sm text-ink-secondary">
        <Translate>No visualization data available.</Translate>
      </p>
    );
  }

  return <DatavizEmbed payload={payload} height={height} />;
};

export { DatavizEmbedById };
