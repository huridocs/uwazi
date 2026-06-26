import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';

const buildPreviewFetchKey = (id: string, query: DatavizQuery): string =>
  `${id}:${JSON.stringify(query)}`;

export { buildPreviewFetchKey };
