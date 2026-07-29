import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

const fixtures: Fixture = {
  relationtypes: [
    {
      _id: new ObjectId(),
      name: 'With legacy properties',
      properties: [{ label: 'legacy property' }],
    },
    {
      _id: new ObjectId(),
      name: 'Without legacy properties',
    },
  ],
  connections: [
    {
      _id: new ObjectId(),
      entity: 'entity-1',
      hub: new ObjectId(),
      template: new ObjectId(),
      metadata: {
        legacy: 'value',
      },
    },
    {
      _id: new ObjectId(),
      entity: 'entity-2',
      hub: new ObjectId(),
      template: new ObjectId(),
    },
  ],
};

export { fixtures };
