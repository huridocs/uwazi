import db from 'api/utils/testing_db';

const templateId = db.id();
const simpleTemplateId = db.id();
const nonExistentId = db.id();
const dictionary1 = db.id();
const dictionary2 = db.id();

export default {
  templates: [
    {
      name: 'template',
      _id: templateId,
      properties: [
        { name: 'name', type: 'text' },
        { name: 'markdown', type: 'markdown' },
        { name: 'numeric', type: 'numeric' },
        { name: 'date', type: 'date' },
        { name: 'daterange', type: 'daterange' },
        { name: 'multidate', type: 'multidate' },
        { name: 'multidaterange', type: 'multidaterange' },
        { name: 'select', type: 'select', content: dictionary1 },
        { name: 'multiselect', type: 'multiselect', content: dictionary2 },
        { name: 'relationship', type: 'relationship', content: simpleTemplateId },
        { name: 'relationship2', type: 'relationship', content: simpleTemplateId },
        {
          name: 'newRelationship',
          type: 'newRelationship',
          query: [
            {
              types: [db.id()],
              direction: 'out',
              match: [
                {
                  templates: [simpleTemplateId],
                  traverse: [],
                },
              ],
            },
          ],
          targetTemplates: [simpleTemplateId],
        },
        { name: 'newRelationship2', type: 'newRelationship', query: [
          {
            types: [db.id()],
            direction: 'out',
            match: [
              {
                templates: [],
                traverse: [
                  {
                    types: [db.id()],
                    direction: 'out',
                    match: [
                      {
                        templates: [simpleTemplateId],
                        traverse: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ], targetTemplates: false },
        { name: 'media', type: 'media' },
        { name: 'image', type: 'image' },
        { name: 'link', type: 'link' },
        { name: 'preview', type: 'preview' },
        { name: 'geolocation', type: 'geolocation' },
        { name: 'required_multiselect', type: 'multiselect', content: dictionary2 },
        { name: 'field_nested', type: 'nested' },
      ],
    },
    {
      _id: simpleTemplateId,
      properties: [{ name: 'markdown', type: 'markdown' }],
    },
  ],
  entities: [
    { sharedId: 'entity1', language: 'en', template: simpleTemplateId },
    { sharedId: 'entity2', language: 'en' },
    { sharedId: 'entity3', language: 'en', template: simpleTemplateId },
  ],
  dictionaries: [
    {
      _id: dictionary1,
      name: 'Dictionary 1',
      values: [
        { _id: db.id(), id: 'dic1-value1' },
        { _id: db.id(), id: 'dic1-value2' },
      ],
    },
    {
      _id: dictionary2,
      name: 'Dictionary 2',
      values: [
        {
          id: '1',
          label: 'subgroup',
          values: [
            { _id: db.id(), id: 'dic2-value1' },
            { _id: db.id(), id: 'dic2-value2' },
          ],
        },
      ],
    },
  ],
};

export { templateId, simpleTemplateId, nonExistentId };
