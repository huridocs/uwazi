import type { IndexDefinition } from './Types';

const IndexMappingRegistry = {
  products: {
    alias: 'products',
    physicalPrefix: 'products',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
    },
    mappings: {
      properties: {
        tenantId: { type: 'keyword' },

        /** Required by delta sync — must be populated on every write so the migration delta pass
         *  can filter documents updated during the bulk reindex window. */
        updatedAt: { type: 'date' },
      },
    },
  } satisfies IndexDefinition,
};

export { IndexMappingRegistry };
