import type { IndexDefinition } from './Types';

const IndexMappingRegistry: Record<string, IndexDefinition> = {
  products: {
    alias: 'products',
    physicalPrefix: 'products',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
      'index.default_pipeline': 'document_timestamps',
    },
    mappings: {
      properties: {
        tenantId: { type: 'keyword' },

        created_at: { type: 'date' },
        updated_at: { type: 'date' },
      },
    },
  },
};

export { IndexMappingRegistry };
