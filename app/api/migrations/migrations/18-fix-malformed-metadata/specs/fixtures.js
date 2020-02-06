/** @format */

import db from 'api/utils/testing_db';

const template1 = db.id();
const [thesauri1, thesauri2] = [db.id(), db.id()];
const [country1, country2, country3] = ['123-c1', 4, '5'];
const [issue1, issue2, issue3] = [6, 7, '345-i1'];
const [entity1, entity2, entity3, entity4] = [db.id(), db.id(), db.id(), db.id()];

export default {
  templates: [
    {
      _id: template1,
      name: 'template with thesaurus',
      properties: [
        {
          label: 'Free text',
          type: 'text',
          name: 'free_text',
        },
        {
          label: 'Country',
          type: 'select',
          name: 'country',
          content: thesauri1,
        },
        {
          label: 'Issues',
          type: 'multiselect',
          name: 'issues',
          content: thesauri2,
        },
      ],
    },
  ],

  dictionaries: [
    {
      _id: thesauri1,
      name: 'Countries',
      values: [
        { _id: db.id(), id: country1, label: 'Country1' },
        { _id: db.id(), id: country2, label: 'Country2' },
        { _id: db.id(), id: country3, label: 'Country3' },
      ],
    },
    {
      _id: thesauri2,
      name: 'Issues',
      values: [
        { _id: db.id(), id: issue1, label: 'Murder' },
        {
          _id: db.id(),
          id: 'group',
          label: 'Others',
          values: [
            { _id: db.id(), id: issue2, label: 'Kidnapping' },
            { _id: db.id(), id: issue3, label: 'Violence' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
    },
  ],

  entities: [
    {
      _id: entity1,
      title: 'entity1',
      language: 'en',
      sharedId: 'shared-e1',
      template: template1,
      metadata: {
        free_text: [{ value: 'some text' }],
        country: [{ value: country1, label: 'Country1_en' }],
        issues: [{ value: issue1, label: 'Issue1_en' }, { value: issue2.toString() }],
      },
    },
    {
      _id: entity2,
      title: 'entity2',
      language: 'es',
      template: template1,
      sharedId: 'shared-e2',
      metadata: {
        free_text: [{ value: 'some Spanish text' }],
        country: [{ value: country2 }],
        issues: [
          { value: 'missingID', label: 'missingID' },
          { value: Number(issue2) },
          { value: issue1.toString() },
          { value: issue3 },
        ],
      },
    },
    {
      _id: entity3,
      title: 'entity3',
      language: 'es',
      template: template1,
      sharedId: 'shared-e2',
      metadata: {
        free_text: [{ value: 'some Spanish text' }],
        country: [{ value: 'missingID', label: 'missingID' }],
        issues: null,
      },
    },
    {
      _id: entity4,
      title: 'entity4',
      language: 'fr',
      template: template1,
      sharedId: 'shared-e2',
      metadata: {
        free_text: [{ value: 'some French text' }],
        country: [{ value: country2 }],
      },
    },
    {
      _id: db.id(),
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          id: thesauri1,
          values: [
            { key: 'Country1', value: 'Country1_en' },
            { key: 'Country2', value: 'Country2_en' },
            { key: 'Country3', value: 'Country3_en' },
          ],
        },
        {
          id: thesauri2,
          values: [
            { key: 'Murder', value: 'Murder_en' },
            { key: 'Kidnapping', value: 'Kidnapping_en' },
            { key: 'Violence', value: 'Violence_en' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        {
          id: thesauri1,
          values: [
            { key: 'Country1', value: 'Country1_es' },
            { key: 'Country2', value: 'Country2_es' },
            { key: 'Country3', value: 'Country3_es' },
          ],
        },
        {
          id: thesauri2,
          values: [
            { key: 'Murder', value: 'Murder_es' },
            { key: 'Kidnapping', value: 'Kidnapping_es' },
            { key: 'Violence', value: 'Violence_es' },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'fr',
      contexts: [],
    },
  ],
};

export { thesauri1, thesauri2, entity1, entity2, entity3, entity4 };
