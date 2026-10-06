import React from 'react';
import { JsonCopyPanel } from './JsonCopyPanel.js';
import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';
import { t } from '#app/I18N/index.js';

type QueryNormalizedViewProps = {
  query: DatavizQuery;
};

const QueryNormalizedView = ({ query }: QueryNormalizedViewProps) => (
  <JsonCopyPanel title={t('System', 'Query', null, false)} value={query} />
);

export { QueryNormalizedView };
