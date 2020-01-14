/** @format */

import db from 'api/utils/testing_db';

const [t1] = [db.id()];
const [dc, di] = [db.id(), db.id()];
const [c1, c2] = ['123-c1', '234-c2'];
const [i1, i2, i3] = ['345-i1', '456-i2', '789-i3'];
const [e1, e2, e3] = [db.id(), db.id(), db.id()];

export default {
  templates: [
    {
      _id: t1,
      name: 'Template',
      properties: [
        {
          label: 'Current Address',
          type: 'geolocation',
          name: 'current_address_geolocation',
        },
        {
          label: 'Country',
          type: 'select',
          name: 'country',
          content: dc,
        },
        {
          label: 'Issues',
          type: 'multiselect',
          name: 'issues',
          content: di,
        },
        {
          label: 'Friends',
          type: 'relationship',
          name: 'friends',
          content: t1,
        },
        {
          label: 'Year',
          type: 'numeric',
          name: 'year',
        },
      ],
    },
  ],

  dictionaries: [
    {
      _id: dc,
      name: 'Countries',
      values: [
        { _id: db.id(), id: c1, label: 'Country1' },
        { _id: db.id(), id: c2, label: 'Country2' },
      ],
    },
    {
      _id: di,
      name: 'Issues',
      values: [
        { _id: db.id(), id: i1, label: 'Murder' },
        {
          _id: db.id(),
          id: i3,
          label: 'Others',
          values: [{ _id: db.id(), id: i2, label: 'Kidnapping' }],
        },
      ],
    },
  ],

  entities: [
    {
      _id: e1,
      title: 'e1',
      icon: {
        type: 'icon1',
      },
      file: 'hasFile',
      language: 'en',
      sharedId: 'shared-e1',
      template: t1,
      metadata: {
        country: c1,
        current_address_geolocation: [{ lat: 1, lng: 2, label: 'a' }],
        issues: [i1, null],
        year: 2019,
        friends: 'shared-e2',
      },
    },
    {
      _id: e2,
      title: 'e2',
      file: null,
      icon: {
        type: 'icon2',
      },
      language: 'en',
      template: t1,
      sharedId: 'shared-e2',
      metadata: {
        country: c2,
        issues: [i1, i2],
        friends: ['shared-e1'],
      },
    },
    {
      _id: e3,
      title: 'e3',
      language: 'en',
      template: t1,
      sharedId: 'shared-e3',
      metadata: {
        country: null,
        issues: [i1, i2],
        friends: ['shared-e1', 'shared-e2'],
      },
    },
    {
      _id: db._id,
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [],
    },
  ],
};

export { t1, c1, c2, i1, i2 };
