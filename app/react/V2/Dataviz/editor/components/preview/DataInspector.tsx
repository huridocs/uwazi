import React from 'react';
import { JsonCopyPanel } from './JsonCopyPanel.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { t } from '#app/I18N/index.js';

type DataInspectorProps = {
  data: DatavizDataDTO | null;
};

const DataInspector = ({ data }: DataInspectorProps) => (
  <JsonCopyPanel title={t('System', 'Data', null, false)} value={data} />
);

export { DataInspector };
