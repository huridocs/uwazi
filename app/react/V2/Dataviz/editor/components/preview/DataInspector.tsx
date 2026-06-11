import React from 'react';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type DataInspectorProps = {
  data: DatavizDataDTO | null;
};

const DataInspector = ({ data }: DataInspectorProps) => (
  <pre className="overflow-auto rounded-lg bg-vellum p-4 text-xs text-ink">
    {data ? JSON.stringify(data, null, 2) : 'No data loaded'}
  </pre>
);

export { DataInspector };
