import { DBFixture } from '#api/migrations/migrations/150-per_namespace_lastSyncs/types.js';

export const fixtures: DBFixture = {
  syncs: [
    {
      name: 'sync1',
      lastSync: 0,
    },
    {
      name: 'sync2',
      lastSync: 1700127956,
    },
    {
      name: 'sync3',
    },
  ],
};
