/** @format */

import db from 'api/utils/testing_db';

const [t1] = [db.id()];
const [dc, di] = [db.id(), db.id()];
const [c1, c2] = ['123-c1', '234-c2'];
const [i1, i2] = ['345-i1', '456-i2'];

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
        { _id: db.id(), id: i2, label: 'Kidnapping' },
      ],
    },
  ],

  entities: [
    {
      _id: db.id(),
      title: 'e1',
      template: t1,
      metadata: {
        country: c1,
        current_address_geolocation: [{ lat: 1, lng: 2, label: 'a' }],
        issues: [i1],
      },
    },
    {
      _id: db.id(),
      title: 'e2',
      template: t1,
      metadata: {
        country: c2,
        issues: [i1, i2],
      },
    },
  ],
};

export { t1, c1, c2, i1, i2 };
