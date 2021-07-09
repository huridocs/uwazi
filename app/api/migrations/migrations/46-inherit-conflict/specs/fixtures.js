import db from 'api/utils/testing_db';

const relationtype = db.id();
const judge = db.id();
const victim = db.id();
const document = db.id();
const country = db.id();
const codeProperty = db.id();

export default {
  entities: [{ title: 'test_doc' }],
  relationtypes: [{ _id: relationtype, name: 'related' }],
  templates: [
    {
      _id: judge,
      name: 'judge',
      properties: [
        { name: 'age', label: 'Age', type: 'Number' },
        { name: 'country', label: 'Country', type: 'relationship', relationtype, content: country },
      ],
    },
    {
      _id: victim,
      name: 'victim',
      properties: [
        { name: 'age', label: 'Age', type: 'Number' },
        {
          name: 'country',
          label: 'Country',
          type: 'relationship',
          relationtype,
          content: country,
          inherit: { type: 'text', property: codeProperty },
        },
      ],
    },
    {
      _id: document,
      name: 'document',
      properties: [
        { name: 'pages', label: 'Pages', type: 'Number' },
        {
          name: 'country_code',
          label: 'Country code',
          type: 'relationship',
          relationtype,
          content: country,
          inherit: { type: 'text', property: codeProperty },
        },
      ],
    },
    {
      _id: country,
      name: 'country',
      properties: [{ _id: codeProperty, name: 'code', label: 'code', type: 'Text' }],
    },
  ],
};
