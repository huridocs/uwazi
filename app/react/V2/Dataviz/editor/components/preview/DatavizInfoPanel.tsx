import React from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { EmbedPanel } from '../sidebar/EmbedPanel.js';

type DatavizInfoPanelProps = {
  definition: DatavizDefinition;
  onChange: (patch: Partial<DatavizDefinition>) => void;
};

const DatavizInfoPanel = ({ definition, onChange }: DatavizInfoPanelProps) => (
  <EmbedPanel
    id={definition.id}
    embedPublic={definition.embedPublic}
    onEmbedPublicChange={value => onChange({ embedPublic: value })}
  />
);

export { DatavizInfoPanel };
