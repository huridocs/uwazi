import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';

const isPreviewQueryReady = (query: DatavizQuery) =>
  query.sources.length > 0 && query.dimensions.length > 0 && query.measures.length > 0;

export { isPreviewQueryReady };
