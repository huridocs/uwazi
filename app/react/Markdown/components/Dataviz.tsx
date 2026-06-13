import React from 'react';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';

type DatavizMarkdownProps = {
  id?: string;
  height?: number | string;
};

const Dataviz = ({ id, height }: DatavizMarkdownProps) => {
  if (!id) {
    return null;
  }

  const parsedHeight = typeof height === 'string' ? Number(height) : height;

  return <DatavizEmbed id={id} height={Number.isFinite(parsedHeight) ? parsedHeight : undefined} />;
};

export { Dataviz };
