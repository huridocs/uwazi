import { ObjectId } from 'mongodb';
import { Fixture } from '#api/migrations/migrations/175-reindex/types.js';

const fixtures: Fixture = {
  entities: [
    {
      _id: new ObjectId(),
      title: 'test_doc',
    },
  ],
};

export { fixtures };
