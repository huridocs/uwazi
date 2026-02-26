import db, { DBFixture } from 'api/utils/testing_db';

const templateWithMismatchesId = db.id();
const templateCorrectId = db.id();
const templateGeolocationId = db.id();
const templateMultipleMismatchesId = db.id();

const createCommonProps = () => [
  {
    _id: db.id(),
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
    prioritySorting: false,
  },
  {
    _id: db.id(),
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
];

export const fixtures: DBFixture = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      newNameGeneration: true,
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],

  templates: [
    // Template with property name mismatches
    {
      _id: templateWithMismatchesId,
      name: 'Template with Mismatches',
      commonProperties: createCommonProps(),
      properties: [
        {
          _id: db.id(),
          label: 'Text Field!',
          name: 'text', // Wrong: should be 'text_field_'
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'Email Address!',
          name: 'emailaddress', // Wrong: should be 'email_address_'
          type: 'text',
        },
      ],
    },

    // Template with already correct property names
    {
      _id: templateCorrectId,
      name: 'Template Already Correct',
      commonProperties: createCommonProps(),
      properties: [
        {
          _id: db.id(),
          label: 'Text field',
          name: 'text_field', // Already correct
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'Simple name',
          name: 'simple_name', // Already correct
          type: 'text',
        },
      ],
    },

    // Template with geolocation type
    {
      _id: templateGeolocationId,
      name: 'Template with Geolocation',
      commonProperties: createCommonProps(),
      properties: [
        {
          _id: db.id(),
          label: 'Location',
          name: 'location', // Wrong: should be 'location_geolocation'
          type: 'geolocation',
        },
      ],
    },

    // Template with multiple mismatches
    {
      _id: templateMultipleMismatchesId,
      name: 'Template Multiple Mismatches',
      commonProperties: createCommonProps(),
      properties: [
        {
          _id: db.id(),
          label: 'Property-One',
          name: 'prop1', // Wrong: should be 'property_one'
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'Property Two!',
          name: 'prop2', // Wrong: should be 'property_two_'
          type: 'numeric',
        },
        {
          _id: db.id(),
          label: 'Property#Three',
          name: 'prop3', // Wrong: should be 'property_three'
          type: 'select',
        },
      ],
    },
  ],

  entities: [
    // Entities for templateWithMismatchesId (multiple languages)
    {
      _id: db.id(),
      sharedId: 'entity1',
      template: templateWithMismatchesId,
      language: 'en',
      title: 'Entity 1 EN',
      metadata: {
        text: [{ value: 'some text' }],
        emailaddress: [{ value: 'test@example.com' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'entity1',
      template: templateWithMismatchesId,
      language: 'es',
      title: 'Entity 1 ES',
      metadata: {
        text: [{ value: 'algún texto' }],
        emailaddress: [{ value: 'test@ejemplo.com' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'entity1',
      template: templateWithMismatchesId,
      language: 'pt',
      title: 'Entity 1 PT',
      metadata: {
        text: [{ value: 'algum texto' }],
        emailaddress: [{ value: 'test@exemplo.com' }],
      },
    },

    // Entity for templateCorrectId (should not be modified)
    {
      _id: db.id(),
      sharedId: 'entity2',
      template: templateCorrectId,
      language: 'en',
      title: 'Entity 2',
      metadata: {
        text_field: [{ value: 'correct name' }],
        simple_name: [{ value: 'also correct' }],
      },
    },

    // Entity for templateGeolocationId
    {
      _id: db.id(),
      sharedId: 'entity3',
      template: templateGeolocationId,
      language: 'en',
      title: 'Entity 3',
      metadata: {
        location: [
          {
            value: {
              lat: 40.7128,
              lon: -74.006,
            },
          },
        ],
      },
    },

    // Entities for templateMultipleMismatchesId
    {
      _id: db.id(),
      sharedId: 'entity4',
      template: templateMultipleMismatchesId,
      language: 'en',
      title: 'Entity 4 EN',
      metadata: {
        prop1: [{ value: 'value one' }],
        prop2: [{ value: 123 }],
        prop3: [{ value: 'option1' }],
      },
    },
    {
      _id: db.id(),
      sharedId: 'entity4',
      template: templateMultipleMismatchesId,
      language: 'es',
      title: 'Entity 4 ES',
      metadata: {
        prop1: [{ value: 'valor uno' }],
        prop2: [{ value: 456 }],
        prop3: [{ value: 'opcion1' }],
      },
    },

    // Entity with empty metadata
    {
      _id: db.id(),
      sharedId: 'entity5',
      template: templateMultipleMismatchesId,
      language: 'en',
      title: 'Entity 5 Empty',
      metadata: {},
    },

    // Entity with partial metadata
    {
      _id: db.id(),
      sharedId: 'entity6',
      template: templateMultipleMismatchesId,
      language: 'en',
      title: 'Entity 6 Partial',
      metadata: {
        prop1: [{ value: 'only first property' }],
      },
    },
  ],
};

export {
  templateWithMismatchesId,
  templateCorrectId,
  templateGeolocationId,
  templateMultipleMismatchesId,
};
