/* eslint-disable max-lines */
/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const userId = db.id();
const collaboratorId = db.id();
const batmanBegins = 'shared2';
const batmanFinishes = 'shared';
const metadataSnippets = 'metadataSnippets';

const multiselect1 = db.id();
const select1 = db.id();
const dateField = db.id();
const richTextField = db.id();
const cityGeolocation = db.id();
const entity1 = db.id();
const entity3 = db.id();
const template = db.id();
const template1 = db.id();
const template2 = db.id();
const templateMetadata1 = db.id();
const templateMetadata2 = db.id();
const countriesDictionaryID = db.id();
const relationType = db.id();
const fixturesTimeOut = 20000;

export const fixtures = {
  files: [
    {
      entity: metadataSnippets,
      type: 'document',
      language: 'eng',
      fullText: {
        1: 'Once upon a time[[1]]',
        2: ' gargoyles lived on building ledges[[13]]',
      },
    },
    {
      type: 'document',
      entity: 'unpublishedSharedId',
      language: 'eng',
      fullText: { 1: 'unpublished document' },
    },
    {
      type: 'document',
      entity: batmanFinishes,
      language: 'eng',
      title: 'Batman finishes en',
      fullText: { 1: 'english[[12]]', 2: 'document[[2]]', 3: 'english[[123]]' },
    },
    {
      type: 'document',
      entity: batmanFinishes,
      language: 'spa',
      title: 'Batman finishes es',
      fullText: { 1: 'spanish[[34]]', 2: 'document[[4]]' },
    },
    {
      type: 'document',
      entity: batmanBegins,
      language: 'eng',
      title: 'Batman begins en',
      fullText: {
        1: 'english[[2]]',
        2: 'another[[5]]',
      },
    },
    {
      type: 'document',
      entity: batmanBegins,
      language: 'spa',
      title: 'Batman begins es',
      fullText: {},
    },
  ],
  entities: [
    {
      _id: db.id(),
      sharedId: batmanFinishes,
      template: template1,
      language: 'en',
      title: 'Batman finishes en',
      published: true,
      generatedToc: true,
      user: userId,
      metadata: {
        relationship: [
          { value: batmanBegins, label: 'Batman begins en' },
          { value: 'unpublished', label: 'Do not show' },
          {
            value: 'this_entity_does_not_exist',
            label: 'this is a relation that should not exist',
          },
        ],
      },
    },
    {
      _id: db.id(),
      sharedId: batmanFinishes,
      template: template1,
      language: 'es',
      title: 'Batman finishes es',
      published: true,
      user: userId,
      generatedToc: true,
      metadata: {
        relationship: [
          { value: batmanBegins, label: 'Batman begins es' },
          { value: 'unpublished', label: 'Do not show' },
        ],
      },
    },
    {
      _id: db.id(),
      sharedId: batmanBegins,
      template: template2,
      language: 'en',
      title: 'Batman begins en',
      published: true,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: batmanBegins,
      template: template2,
      language: 'es',
      title: 'Batman begins es',
      published: true,
      generatedToc: false,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'unpublished',
      template,
      language: 'es',
      title: 'unpublished',
      published: false,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'unpublished',
      template,
      language: 'en',
      title: 'unpublished',
      published: false,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'shared3',
      template: template1,
      language: 'en',
      title: 'template1 title en',
      published: true,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'shared3',
      template: template1,
      language: 'es',
      title: 'template1 title es',
      published: true,
      generatedToc: false,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'shared4',
      template: template1,
      language: 'en',
      title: 'shared 4template1 title en',
      published: true,
      user: userId,
    },
    // permissions
    {
      _id: db.id(),
      sharedId: 'with permissions but not published',
      template,
      language: 'es',
      title: 'with permissions but not published',
      published: false,
      permissions: [{ refId: 'collabId', type: 'user', level: 'read' }],
    },
    //inherited aggregations
    {
      _id: db.id(),
      sharedId: 'inherited',
      title: 'Inherited 1',
      template: template1,
      language: 'en',
      published: true,
      user: userId,
      metadata: {
        relationshipcountry: [
          {
            value: entity1,
            label: 'inherited country',
            inheritedValue: [
              { value: 'EgyptID', label: 'Egypt' },
              { value: 'SpainID', label: 'Spain' },
              { value: 'GermanyID', label: 'Germany' },
            ],
          },
        ],
        relationshipcountryselect: [
          {
            value: entity1,
            label: 'metadata1',
            inheritedValue: [{ value: 'EgyptID', label: 'Egypt' }],
          },
        ],
        relationshipdate: [
          {
            value: entity1,
            label: 'inherited date',
            inheritedValue: [{ value: 20 }, { value: 40 }],
          },
        ],
        relationshiptext: [
          {
            value: entity1,
            label: 'inherited text',
            inheritedValue: [{ value: 'kawans nala' }, { value: 'chow chow' }],
          },
        ],
        relationshipGeolocation: [
          {
            value: entity1,
            label: 'inherited geolocation',
            inheritedValue: [{ value: { lat: 1, lon: 2 } }],
          },
        ],
      },
    },
    {
      _id: db.id(),
      sharedId: 'inherited 2',
      title: 'Inherited 2',
      template: template1,
      language: 'en',
      published: true,
      user: userId,
      metadata: {
        relationshipcountryselect: [
          {
            value: entity3,
            label: 'metadata3',
            inheritedValue: [{ value: 'SpainID', label: 'Cool Spain' }],
          },
        ],
        relationshipcountry: [
          {
            value: entity1,
            label: 'metadata1',
            inheritedValue: [{ value: 'EgyptID', label: 'Egypt' }],
          },
        ],
        relationshipdate: [
          {
            value: entity1,
            label: 'metadata1',
            inheritedValue: [{ value: 40 }],
          },
        ],
        relationshiptext: [
          {
            value: entity1,
            label: 'metadata1',
            inheritedValue: [{ value: 'chow chow' }],
          },
        ],
      },
    },
    //metadata filters
    {
      _id: entity1,
      sharedId: 'metadata1',
      template: templateMetadata1,
      language: 'en',
      title: 'metadata1',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'joker' }],
        field2: [{ value: 'bane' }],
        select1: [{ value: 'EgyptID', label: 'Egypt' }],
        rich_text: [{ value: 'rich' }],
        multiselect1: [
          { value: 'EgyptID', label: 'Egypt' },
          { value: 'SpainID', label: 'Spain' },
          { label: 'Germany', id: 'GermanyID' },
        ],
        groupedDictionary: [{ value: 'GermanyID' }, { value: 'ItalyID' }, { value: 'PortugalID' }],
        nestedField_nested: [{ value: { nested1: ['1', '2', '3'] } }],
        city_geolocation: [{ value: { lat: 1, lon: 2 } }],
        daterange: [{ value: { from: 1547997735, to: 1579533735 } }],
        date: [{ value: 10000 }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'metadata1',
      template: templateMetadata1,
      language: 'es',
      title: 'metadata1 es',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'joker' }],
        field2: [{ value: 'bane' }],
        city_geolocation: [{ value: { lat: 1, lon: 2 } }],
        daterange: [{ value: { from: 1547997735, to: null } }],
        date: [{ value: 10000 }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'metadata2',
      template: templateMetadata1,
      language: 'en',
      title: 'Metadata2',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'joker' }],
        field2: [{ value: 'penguin' }],
        select1: [{ value: 'EgyptID', label: 'Awesome Egypt' }],
        multiselect1: [{ value: 'EgyptID', label: 'Egypt' }],
        groupedDictionary: [{ value: 'GermanyID' }, { value: 'ChinaID' }, { value: 'JapanID' }],
        daterange: [{ value: { from: 1579620135, to: 1611242535 } }],
        date: [{ value: 20000 }],
      },
    },
    {
      _id: entity3,
      sharedId: 'metadata3',
      template: templateMetadata1,
      language: 'en',
      title: 'metádata3',
      published: true,
      user: userId,
      metadata: {
        select1: [{ value: 'SpainID', label: 'Cool Spain' }],
        multiselect1: [{ value: 'SpainID', label: 'Spain' }],
        date: [{ value: 30000 }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'metadata3',
      template: templateMetadata2,
      language: 'en',
      title: ' Metadáta4',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'bane' }],
        field3: [{ value: 'penguin' }],
        select1: [{ value: 'SpainID', label: 'Spain' }],
        multiselect1: [{ value: 'SpainID', label: 'Spain' }],
        nestedField_nested: [{ value: { nested1: ['3', '4', '5'] } }],
        country_geolocation: [{ value: { lat: 1, lon: 2 } }],
        auto_id: [{ value: 'ABC1234' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'metadata4',
      template: templateMetadata2,
      language: 'en',
      title: 'metadata5',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'penguin' }],
        field3: [{ value: 'joker' }],
        nestedField_nested: [{ value: { nested1: ['5', '6', '7'] } }],
        country_geolocation: [{ value: { lat: 1, lon: 2 } }],
        auto_id: [{ value: 'XYZ1234' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'missingTemplate',
      language: 'en',
      title: 'missingTemplate',
      published: true,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'unpublishedSharedId',
      template: templateMetadata1,
      language: 'en',
      title: 'metadata6',
      published: false,
      user: userId,
      metadata: { field1: [{ value: 'joker' }] },
    },
    {
      _id: db.id(),
      sharedId: 'abc123',
      language: 'en',
      title: 'Country Egypt',
      published: true,
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'entityWithEgypt',
      template,
      language: 'en',
      title: 'Something',
      published: true,
      user: userId,
      metadata: { multiselect1: [{ value: 'abc123', label: 'Country Egypt' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithEgyptDictionary',
      template,
      language: 'en',
      title: 'Something',
      published: true,
      user: userId,
      metadata: {
        multiselect1: [{ value: 'EgyptID', label: 'Egypt' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'unsuportedLanguage',
      template,
      language: 'ar',
      title: 'Something',
      published: true,
      user: userId,
      metadata: {
        multiselect1: [{ value: 'SpainID', label: 'Spain' }],
      },
    },
    // snippets in metadata
    {
      _id: db.id(),
      sharedId: metadataSnippets,
      language: 'en',
      title: 'Document about gargoyles',
      metadata: { field1: [{ value: 'This is some text containing the word gargoyles.' }] },
    },
  ],
  templates: [
    { _id: template, properties: [] },
    {
      _id: template1,
      properties: [
        { _id: db.id(), name: 'date', type: 'date', filter: true },
        { _id: db.id(), name: 'multidate', type: 'multidate', filter: true },
        { _id: db.id(), name: 'daterange', type: 'daterange', filter: true },
        { _id: db.id(), name: 'multidaterange', type: 'multidaterange', filter: true },
        {
          _id: db.id(),
          name: 'relationship',
          type: 'relationship',
          filter: true,
          relationType,
          content: template2,
        },
        {
          _id: db.id(),
          name: 'relationshipcountry',
          type: 'relationship',
          filter: true,
          relationType,
          content: templateMetadata1,
          inherit: {
            property: multiselect1,
            type: 'multiselect',
          },
        },
        {
          _id: db.id(),
          name: 'relationshipcountryselect',
          type: 'relationship',
          filter: true,
          relationType,
          content: templateMetadata1,
          inherit: {
            property: select1,
            type: 'select',
          },
        },
        {
          _id: db.id(),
          name: 'relationshipdate',
          type: 'relationship',
          filter: true,
          relationType,
          content: templateMetadata1,
          inherit: {
            property: dateField,
            type: 'date',
          },
        },
        {
          _id: db.id(),
          name: 'relationshiptext',
          type: 'relationship',
          filter: true,
          relationType,
          content: templateMetadata1,
          inherit: {
            property: richTextField,
            type: 'markdown',
          },
        },
        {
          _id: db.id(),
          name: 'relationshipGeolocation',
          type: 'relationship',
          filter: true,
          relationType,
          content: templateMetadata1,
          inherit: {
            property: cityGeolocation,
            type: 'geolocation',
          },
        },
      ],
    },
    { _id: template2, properties: [] },
    {
      _id: templateMetadata1,
      properties: [
        { _id: db.id(), name: 'field1', type: 'text', filter: true },
        { _id: db.id(), name: 'field2', type: 'text', filter: true },
        {
          _id: select1,
          name: 'select1',
          type: 'select',
          filter: true,
          content: countriesDictionaryID.toString(),
        },
        {
          _id: multiselect1,
          name: 'multiselect1',
          type: 'multiselect',
          filter: true,
          content: countriesDictionaryID.toString(),
        },
        { _id: db.id(), name: 'daterange', type: 'daterange', filter: true },
        { _id: dateField, name: 'dateToBeInherited', type: 'date', filter: true },
        {
          _id: db.id(),
          name: 'nestedField_nested',
          type: 'nested',
          nestedProperties: ['nested1', 'nested2'],
          filter: true,
        },
        { _id: cityGeolocation, name: 'city_geolocation', type: 'geolocation', filter: true },
        {
          _id: db.id(),
          name: 'groupedDictionary',
          type: 'multiselect',
          filter: true,
          content: countriesDictionaryID,
        },
        { _id: richTextField, name: 'rich_text', type: 'markdown', filter: true },
      ],
    },
    {
      _id: templateMetadata2,
      properties: [
        { _id: db.id(), name: 'field1', type: 'text', filter: true },
        { _id: db.id(), name: 'field3', type: 'text', filter: true },
        {
          _id: db.id(),
          name: 'select1',
          type: 'select',
          filter: true,
          content: countriesDictionaryID.toString(),
        },
        {
          _id: db.id(),
          name: 'multiselect1',
          type: 'multiselect',
          filter: true,
          content: countriesDictionaryID.toString(),
        },
        {
          _id: db.id(),
          name: 'nestedField_nested',
          type: 'nested',
          nestedProperties: ['nested1', 'nested2'],
          filter: true,
        },
        { _id: db.id(), name: 'country_geolocation', type: 'geolocation', filter: true },
        { _id: db.id(), name: 'auto_id', type: 'generatedid', filter: true },
      ],
    },
  ],
  dictionaries: [
    {
      _id: countriesDictionaryID,
      name: 'Contries Dcitionary',
      values: [
        {
          label: 'Egypt',
          id: 'EgyptID',
        },
        {
          label: 'Chile',
          id: 'ChileID',
        },
        {
          label: 'Spain',
          id: 'SpainID',
        },
        {
          label: 'Europe',
          id: 'EuropeID',
          values: [
            { label: 'Germany', id: 'GermanyID' },
            { label: 'Italy', id: 'ItalyID' },
            { label: 'Portugal', id: 'PortugalID' },
            { label: 'France', id: 'franceID' },
          ],
        },
        {
          label: 'Asia',
          id: 'AsiaID',
          values: [
            { label: 'China', id: 'ChinaID' },
            { label: 'Japan', id: 'JapanID' },
            { label: 'India', id: 'IndiaID' },
          ],
        },
      ],
    },
  ],
  relationtypes: [
    {
      _id: relationType,
      name: 'relation',
      properties: [
        { name: 'status', type: 'select', filter: true },
        { name: 'description', type: 'text', filter: true },
      ],
    },
  ],
  connections: [
    {
      entity: batmanFinishes,
      template: relationType,
      metadata: { status: [{ value: 'open' }], description: [{ value: 'red' }] },
      language: 'en',
    },
    {
      entity: 'shared4',
      template: 'anotherone',
      metadata: { status: [{ value: 'open' }], description: [{ value: 'red' }] },
      language: 'en',
    },
    {
      entity: 'shared3',
      template: relationType,
      metadata: { status: [{ value: 'open' }], description: [{ value: 'red' }] },
      language: 'en',
    },
    {
      entity: batmanFinishes,
      template: relationType,
      metadata: { status: [{ value: 'closed' }], description: [{ value: 'yellow' }] },
      language: 'en',
    },
    {
      entity: batmanFinishes,
      template: relationType,
      metadata: { status: [{ value: 'open' }], description: [{ value: 'red' }] },
      language: 'es',
    },
    {
      entity: 'shared3',
      template: relationType,
      metadata: { status: [{ value: 'open' }], description: [{ value: 'red' }] },
      language: 'es',
    },
    {
      entity: batmanFinishes,
      template: relationType,
      metadata: { status: [{ value: 'closed' }], description: [{ value: 'yellow' }] },
      language: 'es',
    },
  ],
  settings: [{ languages: [{ key: 'en', default: true }, { key: 'es' }] }],
};

export const ids = {
  batmanBegins,
  batmanFinishes,
  metadataSnippets,
  userId,
  collaboratorId,
  template: template.toString(),
  template1: template1.toString(),
  template2: template2.toString(),
  templateMetadata1: templateMetadata1.toString(),
  templateMetadata2: templateMetadata2.toString(),
};

export { fixturesTimeOut };
