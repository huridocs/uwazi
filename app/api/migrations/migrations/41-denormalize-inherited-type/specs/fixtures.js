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
          inherit: true,
          inheritProperty: text,
        },
        {
          _id: db.id(),
          name: 'relationship',
          label: 'Relationship multiselect',
          content: templateOne,
          relationType: db.id(),
          type: 'relationship',
          inherit: true,
          inheritProperty: multiselect.toString(),
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
          inherit: true,
          inheritProperty: numeric,
        },
      ],
    },
    {
      name: 'template_four',
    },
  ],
};

export { text, multiselect, numeric };
