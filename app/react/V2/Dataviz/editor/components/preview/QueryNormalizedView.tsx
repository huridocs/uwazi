import React from 'react';
import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';

type QueryNormalizedViewProps = {
  query: DatavizQuery;
};

const QueryNormalizedView = ({ query }: QueryNormalizedViewProps) => (
  <pre className="overflow-auto rounded-lg bg-vellum p-4 text-xs text-ink">
    {JSON.stringify(query, null, 2)}
  </pre>
);

export { QueryNormalizedView };
