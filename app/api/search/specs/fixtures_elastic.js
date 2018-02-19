/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const userId = db.id();
const batmanBegins = 'shared2';
const batmanFinishes = 'shared';

const template = db.id();
const template1 = db.id();
const template2 = db.id();
const templateMetadata1 = db.id();
const templateMetadata2 = db.id();

export default {
  entities: [
    {_id: db.id(), sharedId: batmanFinishes, template: template1, language: 'en', title: 'Batman finishes en', fullText: 'english[[12]] document[[2]] english[[123]]', published: true, user: userId},
    {_id: db.id(), sharedId: batmanFinishes, template: template1, language: 'es', title: 'Batman finishes es', fullText: 'spanish[[34]] document[[4]]', published: true, user: userId},
    {_id: db.id(), sharedId: batmanBegins, template: template2, language: 'en', title: 'Batman begins en', fullText: 'english[[2]] another[[5]]', published: true, user: userId},
    {_id: db.id(), sharedId: batmanBegins, template: template2, language: 'es', title: 'Batman begins es', published: true, user: userId},
    {_id: db.id(), sharedId: 'unpublished', template: template, language: 'es', title: 'unpublished', published: false, user: userId},
    {_id: db.id(), sharedId: 'shared3', template: template1, language: 'en', title: 'template1 title en', published: true, user: userId},
    {_id: db.id(), sharedId: 'shared3', template: template1, language: 'es', title: 'template1 title es', published: true, user: userId},
    //metadata filters
    {_id: db.id(), sharedId: 'metadata1', template: templateMetadata1, language: 'en', title: 'metadata1', published: true, user: userId,
      metadata: {field1: 'joker', field2: 'bane', select1: 'selectValue1', multiselect1: ['multiValue1', 'multiValue2'],
        nestedField: [
          {nested1: ['1', '2', '3']}
        ]
      }
    },
    {_id: db.id(), sharedId: 'metadata1', template: templateMetadata1, language: 'es', title: 'metadata1 es', published: true, user: userId,
      metadata: {field1: 'joker', field2: 'bane'}
    },
    {_id: db.id(), sharedId: 'metadata2', template: templateMetadata1, language: 'en', title: 'Metadata2', published: true, user: userId,
      metadata: {field1: 'joker', field2: 'penguin', select1: 'selectValue1', multiselect1: ['multiValue1']}
    },
    {_id: db.id(), sharedId: 'metadata3', template: templateMetadata1, language: 'en', title: 'metádata3', published: true, user: userId,
      metadata: {select1: 'selectValue2', multiselect1: ['multiValue2']}
    },
    {_id: db.id(), sharedId: 'metadata3', template: templateMetadata2, language: 'en', title: ' Metadáta4', published: true, user: userId,
      metadata: {field1: 'bane', field3: 'penguin', select1: 'selectValue2', multiselect1: ['multiValue2'],
        nestedField: [
          {nested1: ['3', '4', '5']}
        ]
      }
    },
    {_id: db.id(), sharedId: 'metadata4', template: templateMetadata2, language: 'en', title: 'metadata5', published: true, user: userId,
      metadata: {field1: 'penguin', field3: 'joker',
        nestedField: [
          {nested1: ['5', '6', '7']}
        ]
      }
    },
    {_id: db.id(), sharedId: 'missingTemplate', language: 'en', title: 'missingTemplate', published: true, user: userId},
    {_id: db.id(), sharedId: 'unpublishedSharedId', template: templateMetadata1, language: 'en', title: 'metadata6', fullText: 'unpublished document', published: false, user: userId, metadata: {field1: 'joker'}},
    {_id: db.id(), sharedId: 'abc123', language: 'en', title: 'Country Egypt', published: true, user: userId},
    {_id: db.id(), sharedId: 'entityWithEgypt', template: template, language: 'en', title: 'Something', published: true, user: userId, metadata: {multiselect1: ['abc123']}},
    {_id: db.id(), sharedId: 'entityWithEgyptDictionary', template: template, language: 'en', title: 'Something', published: true, user: userId, metadata: {multiselect1: ['35ae6c24-9f4c-4017-9f01-2bc42ff7ad83']}}
  ],
  templates: [
    {_id: template, properties: []},
    {_id: template1, properties: []},
    {_id: template2, properties: []},
    {_id: templateMetadata1, properties: [
      {name: 'field1', type: 'text'},
      {name: 'field2', type: 'text'},
      {name: 'select1', type: 'select'},
      {name: 'multiselect1', type: 'multiselect'},
      {name: 'nestedField', type: 'nested', nestedProperties: ['nested1', 'nested2']}
    ]},
    {_id: templateMetadata2, properties: [
      {name: 'field1', type: 'text'},
      {name: 'field3', type: 'text'},
      {name: 'select1', type: 'select'},
      {name: 'multiselect1', type: 'multiselect'},
      {name: 'nestedField', type: 'nested', nestedProperties: ['nested1', 'nested2']}
    ]}
  ],
  dictionaries: [
    {
      name: 'Contries Dcitionary',
      values: [
        {
          label: 'Egypt',
          id: '35ae6c24-9f4c-4017-9f01-2bc42ff7ad83'
        },
        {
          label: 'Chile',
          id: 'bce629bf-efc1-40dd-9af0-0542422dcbc3'
        },
        {
          label: 'Egypto',
          id: 'bce629bf-efc1-40dd-9af0-0542422dcbc3'
        }
      ]
    }
  ]
};

export const ids = {
  batmanBegins,
  batmanFinishes,
  userId,
  template1: template1.toString(),
  template2: template2.toString(),
  templateMetadata1: templateMetadata1.toString(),
  templateMetadata2: templateMetadata2.toString()
};
