import React from 'react';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';
import { useDatavizEmbedData } from '#V2/Dataviz/embed/useDatavizEmbedData.js';

type DatavizEmbedByIdProps = {
  id: string;
  height?: number;
};

const DatavizEmbedById = ({ id, height }: DatavizEmbedByIdProps) => {
  const { payload, loading, error } = useDatavizEmbedData(id);

  if (loading) {
    return <p className="text-sm text-ink-secondary">Loading visualization…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!payload) {
    return <p className="text-sm text-ink-secondary">No visualization data available.</p>;
  }

  return <DatavizEmbed payload={payload} height={height} />;
};

export { DatavizEmbedById };
