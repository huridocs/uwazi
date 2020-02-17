import db from 'api/utils/testing_db';

const [t1, t2, t3] = [db.id(), db.id(), db.id()];
const [e1, e2, e3, e4, e5, e6] = [db.id(), db.id(), db.id(), db.id(), db.id(), db.id()];

export default {
  templates: [
    {
      _id: t1,
      name: 'With multiple geolocations',
      properties: [
        {
          label: 'Current Address',
          type: 'geolocation',
          name: 'current_address_geolocation',
        },
        {
          label: 'Important Places',
          type: 'geolocation',
          name: 'important_places_geolocation',
        },
        {
          label: 'Text',
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      _id: t2,
      name: 'Without geolocation',
      properties: [
        {
          label: 'Current Address',
          type: 'text',
          name: 'current_address',
        },
        {
          label: 'Text',
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      _id: t3,
      name: 'With single geolocation',
      properties: [
        {
          label: 'Home',
          type: 'geolocation',
          name: 'home_geolocation',
        },
        {
          label: 'Text',
          type: 'text',
          name: 'text',
        },
      ],
    },
  ],

  entities: [
    {
      _id: db.id(),
      title: 'no metadata',
      template: t1,
    },
    {
      _id: e1,
      title: 'e1',
      template: t2,
      metadata: {
        current_address: { lat: 13, lon: 7 },
        text: 'some text',
      },
    },
    {
      _id: e2,
      title: 'e2',
      template: t1,
      metadata: {
        current_address_geolocation: { lat: 13, lon: 7 },
        important_places_geolocation: { lat: 5, lon: 10 },
        text: 'another text',
      },
    },
    {
      _id: e3,
      title: 'e3',
      template: t1,
      metadata: {
        current_address_geolocation: { lat: 23, lon: 8 },
        text: 'text on e3',
      },
    },
    {
      _id: e4,
      title: 'e4',
      template: t3,
      metadata: {
        home_geolocation: { lat: 23, lon: 6 },
        text: 'text on e4',
      },
    },
    {
      _id: e5,
      title: 'e5',
      template: t1,
      metadata: {
        important_places_geolocation: { lat: 18, lon: 7 },
        text: 'text on e5',
      },
    },
    {
      _id: e6,
      title: 'e6',
      template: t3,
      metadata: {
        home_geolocation: [{ lat: 16, lon: 3 }],
        text: 'text on e6',
      },
    },
  ],
};

export { e1, e2, e3, e4, e5, e6 };
