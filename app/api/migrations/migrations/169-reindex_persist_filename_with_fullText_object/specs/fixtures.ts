import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

const fixtures: Fixture = {
  entities: [
    {
      _id: new ObjectId(),
      title: 'test_doc',
    },
  ],
};

export { fixtures };
