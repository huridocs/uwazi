import React from 'react';
import { JsonCopyPanel } from './JsonCopyPanel.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type DataInspectorProps = {
  data: DatavizDataDTO | null;
};

const DataInspector = ({ data }: DataInspectorProps) => <JsonCopyPanel title="Data" value={data} />;

export { DataInspector };
