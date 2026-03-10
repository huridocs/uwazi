import db from 'api/utils/testing_db';
const templateId = db.id();
const templateId2 = db.id();
const zull = db.id();
const inheritPropertyId = db.id();
export default {
  entities: [
    {
      template: templateId,
      title: 'test_doc',
      sharedId: '123ABC',
      metadata: {
        friend: [
          { value: '456DEF', label: 'test_doc 2' },
          { value: '789ZXY', label: 'test_doc 3' },
        ],
      },
      language: 'en',
    },

    {
      template: templateId2,
      title: 'test_doc 2',
      sharedId: '456DEF',
      metadata: { name: [{ value: 'Bocata Tun' }] },
      language: 'en',
    },
    {
      template: templateId2,
      title: 'test_doc 3',
      sharedId: '789ZXY',
      metadata: { name: [] },
      language: 'en',
    },
    {
      template: templateId,
      title: 'test_doc 4',
      sharedId: '498ABC',
      metadata: {
        friend: [
          { value: '789ABC', label: 'test_doc 5' },
          { value: 'zull', label: 'There is only zull' },
        ],
      },
      language: 'en',
    },
    {
      template: templateId2,
      title: 'test_doc 5',
      sharedId: '789ABC',
      metadata: {},
      language: 'en',
    },
    {
      title: 'Im gona break everything',
    },
    {
      title: 'Try to break it harder',
      template: 'whats a template?',
    },
    {
      _id: zull,
      sharedId: 'zull',
      title: 'There is only zull',
      language: 'en',
      template: templateId2,
    },
  ],
  templates: [
    {
      _id: templateId,
      properties: [
        {
          type: 'relationship',
          relationType: 'something',
          inherit: true,
          content: templateId2,
          inheritProperty: inheritPropertyId,
          name: 'friend',
        },
      ],
    },
    {
      _id: templateId2,
      properties: [{ _id: inheritPropertyId, type: 'text', name: 'name' }],
    },
  ],
};
