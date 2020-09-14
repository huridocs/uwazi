import { testingDB } from 'api/utils/testing_db';

const template1 = testingDB.id();
const template2 = testingDB.id();

export default {
  templates: [
    {
      _id: template1,
      properties: [
        { id: '1', type: 'text', name: 'text' },
        { id: '2', type: 'text', name: 'text_2' },
        { id: '3', type: 'text', name: 'not_present_on_entity' },
      ],
    },
    {
      _id: template2,
      properties: [{ id: '1', type: 'text', name: 'text_3' }],
    },
  ],
  entities: [
    {
      template: template1,
      metadata: {
        text: [{ value: 'value' }],
        text_2: [{ value: 'value2' }],
        text_3: [{ value: 'value3' }],
        text_4: [{ value: 'value4' }],
      },
    },
    {
      title: 'entity without template',
      metadata: {
        text: [{ value: 'value' }],
        text_2: [{ value: 'value2' }],
        text_3: [{ value: 'value3' }],
        text_4: [{ value: 'value4' }],
      },
    },
    {
      template: template1,
      metadata: {
        text: [{ value: 'value' }],
        text_2: [{ value: 'value2' }],
        text_3: [{ value: 'value3' }],
        text_4: [{ value: 'value4' }],
      },
    },
    {
      template: template2,
      metadata: {
        text: [{ value: 'value' }],
        text_2: [{ value: 'value2' }],
        text_3: [{ value: 'value3' }],
        text_4: [{ value: 'value4' }],
      },
    },
    {
      title: 'entity without metadata',
      template: template2,
    },
  ],
};

export { template1, template2 };
