import db from 'api/utils/testing_db';

const templateA = db.id();
const templateB = db.id();

export default {
  templates: [
    {
      _id: templateA,
      name: 'templateA',
      properties: [
        { name: 'relationshipA', type: 'relationship' },
        { name: 'text', type: 'text' },
      ],
    },
    {
      _id: templateB,
      name: 'templateB',
      properties: [
        { name: 'relationshipB', type: 'relationship' },
        { name: 'text', type: 'text' },
      ],
    },
  ],
  entities: [
    {
      template: templateA,
      metadata: {
        text: [{ value: 'text value' }],
        relationshipA: [
          {
            inheritedValue: null,
          },
          {
            inheritedValue: [{ value: 'value', label: 'label' }],
          },
        ],
      },
    },
    {
      template: templateA,
      metadata: {
        relationshipA: [
          {
            inheritedValue: null,
          },
          {
            inheritedValue: null,
          },
        ],
      },
    },
    {
      title: 'test_doc 2',
      template: templateB,
      metadata: {
        relationshipB: [
          {
            inheritedValue: null,
          },
          {
            inheritedValue: [{ value: 'value2', label: 'label2' }],
          },
          {
            inheritedValue: null,
          },
        ],
      },
    },
  ],
};
