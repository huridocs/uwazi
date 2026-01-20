import { Fixture } from '#api/migrations/migrations/156-populate_default_map_layers/types.js';

import db from '#api/utils/testing_db.js';

const fixtures: Fixture = {
  settings: [{ _id: db.id(), languages: [{ key: 'en' }, { key: 'es' }] }],
};

export { fixtures };
