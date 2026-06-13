import React from 'react';
import { DatavizEmbedById } from '#V2/Dataviz/embed/DatavizEmbedById.js';

type DatavizMarkdownProps = {
  id?: string;
  height?: number | string;
};

const Dataviz = ({ id, height }: DatavizMarkdownProps) => {
  if (!id) {
    return null;
  }

  const parsedHeight = typeof height === 'string' ? Number(height) : height;

  return (
    <DatavizEmbedById id={id} height={Number.isFinite(parsedHeight) ? parsedHeight : undefined} />
  );
};

export { Dataviz };
