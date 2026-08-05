import React from 'react';
import { JsonCopyPanel } from './JsonCopyPanel.js';
import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';

type QueryNormalizedViewProps = {
  query: DatavizQuery;
};

const QueryNormalizedView = ({ query }: QueryNormalizedViewProps) => (
  <JsonCopyPanel title="Query" value={query} />
);

export { QueryNormalizedView };
