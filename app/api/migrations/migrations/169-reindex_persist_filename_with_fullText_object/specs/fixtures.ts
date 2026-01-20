import { ObjectId } from 'mongodb';
import { Fixture } from '#api/migrations/migrations/169-reindex_persist_filename_with_fullText_object/types.js';

const fixtures: Fixture = {
  entities: [
    {
      _id: new ObjectId(),
      title: 'test_doc',
    },
  ],
};

export { fixtures };
