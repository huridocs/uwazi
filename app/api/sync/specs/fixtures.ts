/* eslint-disable max-lines */

import db, { DBFixture } from 'api/utils/testing_db';
import { UpdateLog } from 'api/updatelogs';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const oldDoc1 = db.id();
const oldDoc2 = db.id();

const newDoc1 = db.id();
const newDoc2 = db.id();
const newDoc3 = db.id();
const newDoc4 = db.id();
const newDoc5 = db.id();
const newDoc6 = db.id();
const newDoc7 = db.id();
const newDoc8 = db.id();
const newDoc9 = db.id();
const newDoc10 = db.id();

const template1 = db.id();

const template1Property1 = db.id();
const template1Property2 = db.id();
const template1Property3 = db.id();
const template1PropertyThesauri1Select = db.id();
const template1PropertyThesauri2Select = db.id();
const template1PropertyThesauri3MultiSelect = db.id();
const template1PropertyRelationship1 = db.id();
const template1PropertyRelationship2 = db.id();

const template2 = db.id();
const template2PropertyThesauri5Select = db.id();
const template2PropertyRelationship1 = db.id();
const template2PropertyRelationship2 = db.id();

const template3 = db.id();
const template3PropertyRelationship1 = db.id();

const thesauri1 = db.id();
const thesauri1Value1 = db.id();
const thesauri1Value2 = db.id();

const thesauri2 = db.id();

const thesauri3 = db.id();
const thesauri3Value1 = db.id();
const thesauri3Value2 = db.id();

const thesauri4 = db.id();
const thesauri5 = db.id();

const relationship1 = db.id();
const relationship2 = db.id();
const relationship3 = db.id();
const relationship4 = db.id();
const relationship5 = db.id();
const relationship6 = db.id();
const relationship7 = db.id();
const relationship8 = db.id();
const relationship9 = db.id();
const relationship10 = db.id();
const relationship11 = db.id();

const relationtype1 = db.id();
const relationtype2 = db.id();
const relationtype3 = db.id();
const relationtype4 = db.id();
const relationtype5 = db.id();
const relationtype6 = db.id();
const relationtype7 = db.id();

const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();

const translation1 = db.id();

const settingsId = db.id();
const sessionsId = db.id();

const file1 = db.id();
const file2 = db.id();
const file3 = db.id();
const file4 = db.id();
const file5 = db.id();
const customUpload = db.id();

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

const fixtures: DBFixture = {
  updatelogs: [
    {
      timestamp: 20000,
      namespace: 'entities',
      mongoId: newDoc4,
      deleted: true,
    },
    {
      timestamp: 22000,
      namespace: 'connections',
      mongoId: relationship2,
      deleted: false,
    },
    {
      timestamp: 20000,
      namespace: 'connections',
      mongoId: relationship1,
      deleted: false,
    },
    {
      timestamp: 11000,
      namespace: 'connections',
      mongoId: relationship3,
      deleted: false,
    },
    {
      timestamp: 11001,
      namespace: 'connections',
      mongoId: relationship4,
      deleted: false,
    },
    {
      timestamp: 11002,
      namespace: 'connections',
      mongoId: relationship5,
      deleted: false,
    },
    {
      timestamp: 11001,
      namespace: 'connections',
      mongoId: relationship6,
      deleted: false,
    },
    {
      timestamp: 11010,
      namespace: 'connections',
      mongoId: relationship7,
      deleted: false,
    },
    {
      timestamp: 11011,
      namespace: 'connections',
      mongoId: relationship8,
      deleted: false,
    },
    {
      timestamp: 11012,
      namespace: 'connections',
      mongoId: relationship9,
      deleted: false,
    },
    {
      timestamp: 11012,
      namespace: 'connections',
      mongoId: relationship10,
      deleted: false,
    },
    {
      timestamp: 11013,
      namespace: 'connections',
      mongoId: relationship11,
      deleted: false,
    },
    {
      timestamp: 6000,
      namespace: 'entities',
      mongoId: oldDoc1,
      deleted: false,
    },
    {
      timestamp: 7000,
      namespace: 'entities',
      mongoId: oldDoc2,
      deleted: false,
    },
    {
      timestamp: 12000,
      namespace: 'entities',
      mongoId: newDoc2,
      deleted: false,
    },
    {
      timestamp: 13000,
      namespace: 'entities',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 16000,
      namespace: 'entities',
      mongoId: newDoc3,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'entities',
      mongoId: newDoc6,
      deleted: false,
    },
    {
      timestamp: 9001,
      namespace: 'entities',
      mongoId: db.id(),
      deleted: false,
    },
    {
      timestamp: 9003,
      namespace: 'entities',
      mongoId: newDoc10,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template3,
      deleted: false,
    },
    {
      timestamp: 9006,
      namespace: 'dictionaries',
      mongoId: thesauri1,
      deleted: false,
    },
    {
      timestamp: 9009,
      namespace: 'dictionaries',
      mongoId: thesauri2,
      deleted: false,
    },
    {
      timestamp: 9007,
      namespace: 'dictionaries',
      mongoId: thesauri3,
      deleted: false,
    },
    {
      timestamp: 9008,
      namespace: 'dictionaries',
      mongoId: thesauri4,
      deleted: true,
    },
    {
      timestamp: 9001,
      namespace: 'dictionaries',
      mongoId: thesauri5,
      deleted: false,
    },
    {
      timestamp: 9100,
      namespace: 'relationtypes',
      mongoId: relationtype1,
      deleted: false,
    },
    {
      timestamp: 9103,
      namespace: 'relationtypes',
      mongoId: relationtype2,
      deleted: false,
    },
    {
      timestamp: 9102,
      namespace: 'relationtypes',
      mongoId: relationtype3,
      deleted: false,
    },
    {
      timestamp: 9101,
      namespace: 'relationtypes',
      mongoId: relationtype4,
      deleted: false,
    },
    {
      timestamp: 9107,
      namespace: 'relationtypes',
      mongoId: relationtype5,
      deleted: false,
    },
    {
      timestamp: 9106,
      namespace: 'relationtypes',
      mongoId: relationtype6,
      deleted: false,
    },
    {
      timestamp: 9105,
      namespace: 'relationtypes',
      mongoId: relationtype7,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'migrations',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 9001,
      namespace: 'settings',
      mongoId: settingsId,
      deleted: false,
    },
    {
      timestamp: 9002,
      namespace: 'sessions',
      mongoId: sessionsId,
      deleted: false,
    },
    {
      timestamp: 11500,
      namespace: 'translations',
      mongoId: translation1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: db.id(),
      deleted: true,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: file1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: file2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: file3,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: file4,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'files',
      mongoId: file5,
      deleted: false,
    },
    {
      timestamp: 9001,
      namespace: 'files',
      mongoId: customUpload,
      deleted: false,
    },
  ],

  files: [
    {
      _id: file1,
      entity: 'newDoc1SharedId',
      type: 'attachment',
      filename: 'test2.txt',
      fullText: { 1: 'first page' },
    },
    {
      _id: file2,
      entity: 'entitytest.txt',
      type: 'attachment',
      filename: 'test.txt',
    },
    {
      _id: file3,
      entity: 'newDoc6SharedId',
      filename: 'test.txt',
    },
    {
      _id: file4,
      entity: 'newDoc1SharedId',
      type: 'attachment',
      filename: `${newDoc1.toString()}.jpg`,
    },
    {
      _id: file5,
      entity: 'newDoc3SharedId',
      type: 'attachment',
      filename: `${newDoc1.toString()}.jpg`,
    },
    {
      _id: customUpload,
      filename: 'customUpload.gif',
      type: 'custom',
    },
  ],

  entities: [
    {
      _id: newDoc1,
      sharedId: 'newDoc1SharedId',
      title: 'a new entity',
      template: template1,
      metadata: {
        t1Property1: [{ value: 'sync property 1' }],
        t1Property2: [{ value: 'sync property 2' }],
        t1Property3: [{ value: 'sync property 3' }],
        t1Thesauri1Select: [{ value: thesauri1Value2.toString() }],
        t1Relationship1: [{ value: newDoc3.toString() }],
        t1Thesauri2Select: [{ value: db.id().toString() }],
        t1Thesauri3MultiSelect: [
          { value: thesauri3Value2.toString() },
          { value: thesauri3Value1.toString() },
        ],
      },
    },
    {
      _id: newDoc2,
      title: 'another new entity',
      template: template1,
      sharedId: 'entitytest.txt',
      metadata: {
        t1Property1: [{ value: 'another doc property 1' }],
        t1Property2: [{ value: 'another doc property 2' }],
        t1Thesauri3MultiSelect: [{ value: thesauri3Value2.toString() }],
      },
    },
    {
      _id: newDoc5,
      sharedId: 'newDoc5SharedId',
      title: 'New Doc 5',
      template: template1,
    },
    {
      _id: newDoc3,
      sharedId: 'newDoc3SharedId',
      title: 'New Doc 3',
      template: template2,
    },
    {
      _id: newDoc7,
      sharedId: 'newDoc7SharedId',
      title: 'New Doc 7',
      template: template2,
    },
    {
      _id: newDoc8,
      sharedId: 'newDoc8SharedId',
      title: 'New Doc 8',
      template: template2,
    },
    {
      _id: newDoc9,
      sharedId: 'newDoc9SharedId',
      title: 'New Doc 9',
      template: template2,
    },
    {
      _id: newDoc6,
      sharedId: 'newDoc6SharedId',
      title: 'new doc 6',
      template: template3,
    },
    {
      _id: newDoc10,
      sharedId: 'newDoc10SharedId',
      title: 'New Doc 10',
      template: undefined,
    },
  ],
  connections: [
    {
      _id: relationship1,
      entity: 'newDoc1SharedId',
      template: relationtype1,
      hub: hub1,
    },
    {
      _id: relationship2,
      entity: 'newDoc1SharedId',
      template: relationtype3,
      hub: hub1,
    },
    {
      _id: relationship3,
      entity: 'newDoc6SharedId',
      template: relationtype1,
      hub: hub1,
    },
    {
      _id: relationship4,
      entity: 'newDoc1SharedId',
      template: relationtype2,
      hub: hub2,
    },
    {
      _id: relationship5,
      entity: 'newDoc5SharedId',
      template: relationtype7,
      hub: hub2,
    },
    {
      _id: relationship8,
      entity: 'newDoc7SharedId',
      template: relationtype7,
      hub: hub2,
    },
    {
      _id: relationship6,
      entity: 'newDoc5SharedId',
      template: relationtype6,
      hub: hub2,
    },
    {
      _id: relationship7,
      entity: 'newDoc3SharedId',
      template: null,
      hub: hub2,
    },
    {
      _id: relationship9,
      entity: 'newDoc1SharedId',
      template: null,
      hub: hub3,
    },
    {
      _id: relationship10,
      entity: 'newDoc8SharedId',
      template: relationtype4,
      hub: hub3,
    },
    {
      _id: relationship11,
      entity: 'newDoc9SharedId',
      template: relationtype4,
      hub: hub3,
    },
  ],

  relationtypes: [
    { _id: relationtype1 },
    { _id: relationtype2 },
    { _id: relationtype3 },
    { _id: relationtype4, name: 'relationtype4' },
    { _id: relationtype5 },
    { _id: relationtype6 },
    { _id: relationtype7 },
  ],

  dictionaries: [
    {
      _id: thesauri4,
      name: 'thesauri4',
    },
    {
      _id: thesauri5,
      name: 'thesauri5',
    },
  ],

  translationsV2: [
    createTranslationDBO('Sytem Key', 'System Value', 'en', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('template1', 'template1T', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Property1L', 't1Property1T', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Relationship1L', 't1Relationship1T', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Relationship2L', 't1Relationship2T', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Thesauri2SelectL', 't1Thesauri2SelectT', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Thesauri3MultiSelectL', 't1Thesauri3MultiSelectT', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t1Relationship1', 't1Relationship1', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('Template Title', 'Template Title translated', 'en', {
      id: template1.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('template2', 'template2T', 'en', {
      id: template2.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('t2Relationship2L', 't2Relationship2T', 'en', {
      id: template2.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
    createTranslationDBO('anotherL', 'anotherT', 'en', {
      id: template2.toString(),
      type: 'Entity',
      label: 'Entity',
    }),
  ],

  translations: [
    {
      _id: translation1,
      locale: 'en',
      contexts: [
        {
          id: 'System',
          values: [{ key: 'Sytem Key', value: 'System Value' }],
        },
        {
          type: 'Entity',
          id: template1,
          values: [
            { key: 'template1', value: 'template1T' },
            { key: 't1Property1L', value: 't1Property1T' },
            { key: 't1Relationship1L', value: 't1Relationship1T' },
            { key: 't1Relationship2L', value: 't1Relationship2T' },
            { key: 't1Thesauri2SelectL', value: 't1Thesauri2SelectT' },
            { key: 't1Thesauri3MultiSelectL', value: 't1Thesauri3MultiSelectT' },
            { key: 't1Relationship1', value: 't1Relationship1' },
            { key: 'Template Title', value: 'Template Title translated' },
          ],
        },
        {
          type: 'Entity',
          id: template2,
          values: [
            { key: 'template2', value: 'template2T' },
            { key: 't2Relationship2L', value: 't2Relationship2T' },
            { key: 'anotherL', value: 'anotherT' },
          ],
        },
        {
          type: 'Entity',
          id: template3,
        },
        {
          type: 'Dictionary',
          id: thesauri1,
        },
        {
          type: 'Dictionary',
          id: thesauri2,
        },
        {
          type: 'Dictionary',
          id: thesauri3,
          values: [],
        },
        {
          type: 'Connection',
          id: relationtype1,
          values: [],
        },
        {
          type: 'Connection',
          id: relationtype2,
        },
        {
          type: 'Connection',
          id: relationtype4,
          values: [],
        },
        {
          type: 'Connection',
          id: relationtype7,
          values: [],
        },
      ],
    },
  ],

  settings: [
    {
      _id: settingsId,
      languages: [{ key: 'en', default: true, label: 'en' }],
      sync: [
        {
          username: 'user1',
          password: 'password1',
          url: 'url1',
          name: 'target1',
          active: true,
          config: {},
        },
        {
          username: 'user2',
          password: 'password2',
          url: 'url2',
          name: 'target2',
          active: false,
          config: {},
        },
        {
          username: 'user3',
          password: 'password3',
          url: 'url3',
          name: 'target3',
          active: true,
          config: {},
        },
      ],
    },
  ],
};

const host1Fixtures: DBFixture = {
  ...fixtures,
  syncs: [
    {
      lastSync: 8999,
      name: 'target1',
    },
  ],
  updatelogs: fixtures.updatelogs.filter(
    (log: UpdateLog) => log.mongoId.toString() !== template3.toString()
  ),
  templates: [
    {
      _id: template1,
      name: 'template1',
      entityViewPage: 'id_of_a_page',
      commonProperties: [{ label: 'Template Title', name: 'title' }],
      properties: [
        {
          _id: template1Property1,
          name: 't1Property1',
          label: 't1Property1L',
        },
        {
          _id: template1Property2,
          name: 't1Property2',
          label: 't1Property2L',
        },
        {
          _id: template1Property3,
          name: 't1Property3',
          label: 't1Property3L',
        },
        {
          _id: template1PropertyThesauri1Select,
          name: 't1Thesauri1Select',
          label: 't1Thesauri1SelectL',
          type: 'select',
          content: thesauri1,
        },
        {
          _id: template1PropertyThesauri2Select,
          name: 't1Thesauri2Select',
          label: 't1Thesauri2SelectL',
          type: 'select',
          content: thesauri2,
        },
        {
          _id: template1PropertyThesauri3MultiSelect,
          name: 't1Thesauri3MultiSelect',
          label: 't1Thesauri3MultiSelectL',
          type: 'multiselect',
          content: thesauri3,
        },
        {
          _id: template1PropertyRelationship1,
          name: 't1Relationship1',
          label: 't1Relationship1L',
          type: 'relationship',
          content: template2,
          relationType: relationtype4,
        },
        {
          _id: template1PropertyRelationship2,
          name: 't1Relationship2',
          label: 't1Relationship2L',
          type: 'relationship',
          content: '',
          relationType: relationtype5,
        },
      ],
    },
    {
      _id: template2,
      name: 'template2',
      properties: [
        {
          _id: template2PropertyThesauri5Select,
          name: 't2Thesauri3MultiSelect',
          label: 't2Thesauri3MultiSelectL',
          type: 'select',
          content: thesauri5,
        },
        {
          _id: template2PropertyRelationship1,
          name: 't2Relationship1',
          label: 't2Relationship1L',
          type: 'relationship',
          content: '',
          relationType: relationtype6,
        },
        {
          _id: template2PropertyRelationship2,
          name: 't2Relationship2',
          label: 't2Relationship2L',
          type: 'relationship',
          content: template1,
          relationType: relationtype7,
        },
      ],
    },
  ],
  dictionaries: [
    {
      _id: thesauri1,
      name: 'thesauri1',
      values: [
        {
          _id: thesauri1Value1,
          label: 'th1value1',
        },
        {
          _id: thesauri1Value2,
          label: 'th1value2',
        },
      ],
    },
    {
      _id: thesauri2,
      name: 'thesauri2',
    },
    {
      _id: thesauri3,
      name: 'thesauri3',
      values: [
        {
          _id: thesauri3Value1,
          label: 'th3value1',
        },
        {
          _id: thesauri3Value2,
          label: 'th3value2',
        },
      ],
    },
  ],
  settings: [
    {
      _id: settingsId,
      languages: [{ key: 'en', default: true, label: 'en' }],
      sync: [
        {
          url: 'http://localhost:6667',
          name: 'target1',
          active: true,
          username: 'user',
          password: 'password',
          config: {
            templates: {
              [template1.toString()]: {
                properties: [
                  template1Property1.toString(),
                  template1Property2.toString(),
                  template1PropertyThesauri1Select.toString(),
                  template1PropertyRelationship1.toString(),
                ],
                attachments: true,
              },
            },
          },
        },
        {
          url: 'http://localhost:6668',
          name: 'target2',
          active: true,
          username: 'user2',
          password: 'password2',
          config: {
            templates: {
              [template2.toString()]: { properties: [] },
            },
          },
        },
      ],
    },
  ],
};

const host2Fixtures: DBFixture = {
  ...fixtures,
  updatelogs: fixtures.updatelogs.filter(
    (log: UpdateLog) => log.mongoId.toString() === template3.toString()
  ),
  templates: [
    {
      _id: template3,
      name: 'template3',
      properties: [
        {
          _id: template3PropertyRelationship1,
          name: 't3Relationship2',
          type: 'relationship',
          content: '',
          relationType: relationtype1,
        },
      ],
    },
  ],
  settings: [
    {
      _id: settingsId,
      languages: [{ key: 'es', default: true, label: 'es' }],
      sync: [
        {
          url: 'http://localhost:6668',
          name: 'target2',
          active: true,
          username: 'user2',
          password: 'password2',
          config: {
            templates: {
              [template3.toString()]: { properties: [], attachments: true },
            },
          },
        },
      ],
    },
  ],
};

export {
  host1Fixtures,
  host2Fixtures,
  template1,
  template2,
  thesauri1,
  thesauri1Value2,
  newDoc1,
  newDoc3,
  relationtype4,
  relationship9,
  hub3,
};
