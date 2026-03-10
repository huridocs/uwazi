import db from 'api/utils/testing_db';

const text = db.id();
const multiselect = db.id();
const numeric = db.id();
const templateOne = db.id();
const templateTwo = db.id();

export default {
  entities: [{ title: 'test_doc' }],
  templates: [
    {
      _id: templateOne,
      name: 'template_one',
      properties: [
        { _id: text, name: 'Text', label: 'text', type: 'text' },
        { _id: multiselect, name: 'multiselect', label: 'Multiselect', type: 'multiselect' },
      ],
    },
    {
      name: 'template_two',
      _id: templateTwo,
      properties: [
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship text',
          content: templateOne,
          relationType: db.id(),
          type: 'relationship',
          inherit: {
            property: text,
            type: 'text',
          },
        },
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship multiselect',
          content: templateOne,
          relationType: db.id(),
          type: 'relationship',
          inherit: {
            property: multiselect.toString(),
            type: 'multiselect',
          },
        },
        { _id: numeric, name: 'numeric', label: 'Numeric', type: 'numeric' },
      ],
    },
    {
      name: 'template_three',
      properties: [
        { _id: db.id(), name: 'Text', label: 'text', type: 'text' },
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship numeric',
          relationType: db.id(),
          type: 'relationship',
          inherit: {
            property: numeric,
            type: 'numeric',
          },
        },
      ],
    },
    {
      name: 'template_four',
    },
    {
      name: 'template_five',
      _id: db.id(),
      properties: [
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship text',
          content: templateOne,
          relationType: db.id(),
          type: 'relationship',
          inherit: false,
          inheritProperty: text,
        },
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship multiselect',
          content: templateOne,
          relationType: db.id(),
          type: 'relationship',
          inherit: false,
          inheritProperty: multiselect.toString(),
        },
        { _id: numeric, name: 'numeric', label: 'Numeric', type: 'numeric' },
      ],
    },
    {
      name: 'template_six',
      properties: [
        { _id: db.id(), name: 'Text', label: 'text', type: 'text' },
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship numeric',
          relationType: db.id(),
          type: 'relationship',
          inherit: false,
          inheritProperty: numeric,
        },
      ],
    },
  ],
};

export { text, multiselect, numeric };
