import Immutable from 'immutable';

const state = {
  entityView: {
    entity: Immutable.fromJS({
      template: 't1',
      title: 'Entity 1',
      creationDate: 1234,
      metadata: {
        description: [{ value: 'A long description' }],
        date: [{ value: 237600000 }],
        main_image: [{ value: 'https://www.google.com' }],
        inherited_text: [
          {
            value: '7ycel666l65vobt9',
            label: 'Corte Interamericana de Derechos Humanos',
            icon: null,
            type: 'relationship',
            inheritedValue: [
              {
                value: 'something',
              },
            ],
            inheritedType: 'text',
          },
        ],
      },
    }),
  },
  templates: Immutable.fromJS([
    {
      _id: 't1',
      commonProperties: [{ name: 'title', label: 'Title' }],
      properties: [
        { name: 'description', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'main_image', label: 'Main Image', type: 'image' },
        { name: 'inherited_text', label: 'Inherited Text', type: 'relationship' },
      ],
    },
  ]),
  thesauris: Immutable.fromJS([{}]),
  translations: Immutable.fromJS([
    {
      locale: 'en',
      contexts: [
        {
          id: 't1',
          values: { Title: 'Title translated', 'Main Image': 'Main Image translated' },
        },
      ],
    },
  ]),
  settings: { collection: Immutable.fromJS({ newNameGeneration: true }) },
  inlineEdit: Immutable.fromJS({ inlineEdit: false }),
  locale: 'en',
};

export { state };
