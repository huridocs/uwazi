import db from 'api/utils/testing_db';

const templateId = db.id();
export default {
  entities: [
    {
      metadata: {
        geolocation_geolocation: [
          {
            value: {
              lat: 1.1,
              lon: -2.2,
              label: '',
            },
          },
        ],
        text: [
          {
            value: 'text',
          },
        ],
      },
      template: templateId,
      type: 'entity',
    },
    {
      metadata: {
        geolocation_geolocation: [
          {
            value: {
              lat: '1.1',
              lon: '-2.2',
              label: '',
            },
          },
        ],
        text: [
          {
            value: 'text',
          },
        ],
      },
      template: templateId,
      type: 'entity',
    },
    {
      metadata: {
        geolocation_geolocation: [
          {
            value: {
              lat: '1.1.1',
              lon: '-2.2',
              label: '',
            },
          },
        ],
        text: [
          {
            value: 'text',
          },
        ],
      },
      template: templateId,
      type: 'entity',
    },
    {
      metadata: {
        geolocation_geolocation: [],
        text: [
          {
            value: 'text',
          },
        ],
      },
      template: templateId,
      type: 'entity',
    },
    {
      metadata: {
        geolocation_geolocation: null,
        text: [
          {
            value: 'text',
          },
        ],
      },
      template: templateId,
      type: 'entity',
    },
  ],
  templates: [
    {
      _id: templateId,
      properties: [
        { name: 'geolocation_geolocation', type: 'geolocation' },
        { name: 'text', type: 'text' },
      ],
    },
  ],
};
