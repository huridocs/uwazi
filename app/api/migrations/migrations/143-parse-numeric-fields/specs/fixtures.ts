import { ObjectId } from 'mongodb';

const template1 = new ObjectId();
const template2 = new ObjectId();

export const fixtures = {
  templates: [
    {
      _id: template1,
      name: 'template1',
      properties: [
        {
          _id: new ObjectId(),
          label: 'Numeric 1',
          type: 'numeric',
          name: 'numeric_1',
        },
        {
          _id: new ObjectId(),
          label: 'Numeric 2',
          type: 'numeric',
          name: 'numeric_2',
        },
        {
          _id: new ObjectId(),
          label: 'Text',
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      _id: template2,
      name: 'template1',
      properties: [
        {
          _id: new ObjectId(),
          label: 'Numeric 3',
          type: 'numeric',
          name: 'numeric_3',
        },
      ],
    },
  ],
  entities: [
    {
      _id: new ObjectId(),
      sharedId: 'entityNoTemplate',
      language: 'en',
      metadata: {
        numeric_1: [{ value: '4' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity1',
      language: 'en',
      template: template1,
      metadata: {
        numeric_1: [{ value: 0.5 }],
        numeric_2: [{ value: '1.5' }],
        text: [{ value: 'some text' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity2',
      language: 'en',
      template: template1,
      metadata: {
        numeric_1: [{ value: '2.5' }],
        numeric_2: [{ value: '3.5' }],
        text: [{ value: 'some text' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity3',
      language: 'en',
      template: template2,
      metadata: {
        numeric_3: [{ value: 4.5 }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity4',
      language: 'en',
      template: template2,
      metadata: {
        numeric_3: [{ value: '5' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity5',
      language: 'en',
      template: template2,
      metadata: {
        numeric_3: [{ value: '' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity6',
      language: 'en',
      template: template1,
      metadata: {
        numeric_1: [{ value: '6.5' }],
        numeric_2: [{ value: '' }],
      },
    },
    {
      _id: new ObjectId(),
      sharedId: 'entity7',
      language: 'en',
      template: template1,
      metadata: {
        numeric_1: [],
      },
    },
  ],
};
