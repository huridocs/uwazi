import React from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { EmbedPanel } from '../sidebar/EmbedPanel.js';

type DatavizInfoPanelProps = {
  definition: DatavizDefinition;
};

const DatavizInfoPanel = ({ definition }: DatavizInfoPanelProps) => (
  <EmbedPanel id={definition.id} />
);

export { DatavizInfoPanel };
