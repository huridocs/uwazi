/** @format */

/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const userId = db.id();
const batmanBegins = 'shared2';
const batmanFinishes = 'shared';
const metadataSnippets = 'metadataSnippets';

const template = db.id();
const template1 = db.id();
const template2 = db.id();
const templateMetadata1 = db.id();
const templateMetadata2 = db.id();
const countriesDictionaryID = db.id();
const relationType = db.id();
const fixturesTimeOut = 20000;

export default {
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
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: batmanFinishes,
      template: template1,
      language: 'es',
      title: 'Batman finishes es',
      published: true,
      user: userId,
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
    //metadata filters
    {
      _id: db.id(),
      sharedId: 'metadata1',
      template: templateMetadata1,
      language: 'en',
      title: 'metadata1',
      published: true,
      user: userId,
      metadata: {
        field1: [{ value: 'joker' }],
        field2: [{ value: 'bane' }],
        select1: [{ value: 'selectValue1' }],
        rich_text: [{ value: 'rich' }],
        multiselect1: [{ value: 'multiValue1' }, { value: 'multiValue2' }],
        groupedDictionary: [{ value: 'spainID' }],
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
        select1: [{ value: 'selectValue1' }],
        multiselect1: [{ value: 'multiValue1' }],
        groupedDictionary: [{ value: 'spainID' }],
        daterange: [{ value: { from: 1579620135, to: 1611242535 } }],
        date: [{ value: 20000 }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'metadata3',
      template: templateMetadata1,
      language: 'en',
      title: 'metádata3',
      published: true,
      user: userId,
      metadata: {
        select1: [{ value: 'selectValue2' }],
        multiselect1: [{ value: 'multiValue2' }],
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
        select1: [{ value: 'selectValue2' }],
        multiselect1: [{ value: 'multiValue2' }],
        nestedField_nested: [{ value: { nested1: ['3', '4', '5'] } }],
        country_geolocation: [{ value: { lat: 1, lon: 2 } }],
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
        multiselect1: [{ value: '35ae6c24-9f4c-4017-9f01-2bc42ff7ad83', label: 'Egypt' }],
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
      metadata: { multiselect1: [{ value: 'bce629bf-efc1-40dd-9af0-0542422dcbc3' }] },
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
        { name: 'status_relationship_filter', type: 'relationshipfilter', relationType },
        { name: 'date', type: 'date', filter: true },
        { name: 'multidate', type: 'multidate', filter: true },
        { name: 'daterange', type: 'daterange', filter: true },
        { name: 'multidaterange', type: 'multidaterange', filter: true },
      ],
    },
    { _id: template2, properties: [] },
    {
      _id: templateMetadata1,
      properties: [
        { name: 'field1', type: 'text', filter: true },
        { name: 'field2', type: 'text', filter: true },
        { name: 'select1', type: 'select', filter: true },
        { name: 'multiselect1', type: 'multiselect', filter: true },
        { name: 'daterange', type: 'daterange', filter: true },
        { name: 'date', type: 'date', filter: true },
        {
          name: 'nestedField_nested',
          type: 'nested',
          nestedProperties: ['nested1', 'nested2'],
          filter: true,
        },
        { name: 'city_geolocation', type: 'geolocation', filter: true },
        {
          name: 'groupedDictionary',
          type: 'multiselect',
          filter: true,
          content: countriesDictionaryID,
        },
        { name: 'rich_text', type: 'markdown', filter: true },
      ],
    },
    {
      _id: templateMetadata2,
      properties: [
        { name: 'field1', type: 'text', filter: true },
        { name: 'field3', type: 'text', filter: true },
        { name: 'select1', type: 'select', filter: true },
        { name: 'multiselect1', type: 'multiselect', filter: true },
        {
          name: 'nestedField_nested',
          type: 'nested',
          nestedProperties: ['nested1', 'nested2'],
          filter: true,
        },
        { name: 'country_geolocation', type: 'geolocation', filter: true },
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
          id: '35ae6c24-9f4c-4017-9f01-2bc42ff7ad83',
        },
        {
          label: 'Chile',
          id: 'bce629bf-efc1-40dd-9af0-0542422dcbc4',
        },
        {
          label: 'Egypto',
          id: 'bce629bf-efc1-40dd-9af0-0542422dcbc3',
        },
        {
          label: 'Europe',
          id: 'bce629bf-efc1-40dd-9af0-0542422dcbc5',
          values: [
            { label: 'Spain', id: 'spainID' },
            { label: 'France', id: 'franceID' },
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
};

export const ids = {
  batmanBegins,
  batmanFinishes,
  metadataSnippets,
  userId,
  template1: template1.toString(),
  template2: template2.toString(),
  templateMetadata1: templateMetadata1.toString(),
  templateMetadata2: templateMetadata2.toString(),
};

export { fixturesTimeOut };
