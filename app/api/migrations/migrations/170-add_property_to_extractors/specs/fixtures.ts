import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

const fixtures: Fixture = {
  ixextractors: [
    {
      _id: new ObjectId(),
      name: 'ex1',
      property: 'prop1',
      templates: ['a1', 'b2'],
    },
    {
      _id: new ObjectId(),
      name: 'ex2',
      property: 'prop2',
      templates: ['b2'],
    },
    {
      _id: new ObjectId(),
      name: 'ex3',
      property: 'prop3',
      templates: ['a1', 'c1'],
    },
  ],
};

export { fixtures };
