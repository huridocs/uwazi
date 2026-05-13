import { ObjectId } from 'mongodb';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],

  translationsV2: [
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'Red',
      language: 'en',
      value: 'Red in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'Blue',
      language: 'en',
      value: 'Blue in English',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
      key: 'thesaurus_colors',
      language: 'en',
      value: 'thesaurus_colors in English',
    },
    {
      _id: new ObjectId(),
      key: 'Red',
      value: 'Red in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Blue',
      value: 'Blue in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'thesaurus_colors',
      value: 'thesaurus_colors in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'thesaurus_colors',
        id: factory.id('thesaurus_colors').toHexString(),
      },
    },
  ],

  dictionaries: [
    factory.thesauri('thesaurus_colors', [
      ['red_id', 'Red'],
      ['blue_id', 'Blue'],
      ['green_id', 'Green'],
    ]),
  ],

  relationtypes: [
    {
      _id: factory.id('relation_type'),
      name: 'relation_type',
      properties: [],
      __v: 0,
    },
  ],

  templates: [
    factory.template('Basic Template', []),

    factory.template('Related Template', [factory.property('related_text', 'text')]),

    factory.template('Template With Required', [
      factory.property('required_text', 'text', { required: true }),
    ]),

    factory.template('Full Template', [
      factory.property('text', 'text'),
      factory.property('numeric', 'numeric'),
      factory.property('markdown', 'markdown'),
      factory.property('generatedid', 'generatedid'),
      factory.property('date', 'date'),
      factory.property('multidate', 'multidate'),
      factory.property('daterange', 'daterange'),
      factory.property('multidaterange', 'multidaterange'),
      factory.property('link', 'link'),
      factory.property('image', 'image'),
      factory.property('geolocation_geolocation', 'geolocation'),
      factory.property('select', 'select', {
        content: factory.id('thesaurus_colors').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_colors').toHexString(),
      }),
      factory.property('relationship', 'relationship', {
        relationType: factory.id('relation_type').toHexString(),
        content: factory.id('Related Template').toHexString(),
        inherit: {
          property: factory.id('related_text').toHexString(),
          type: 'text',
        },
      }),
      factory.property('nested', 'nested'),
      factory.property('preview', 'preview'),
      factory.property('media', 'media'),
    ]),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'required_entity',
      'Template With Required',
      {},
      { title: 'Required Entity' },
      {
        en: {
          title: 'Required Entity EN',
          metadata: {
            required_text: [factory.metadataValue('Some required text')],
          },
        },
        pt: {
          title: 'Required Entity PT',
          metadata: {
            required_text: [factory.metadataValue('Some required text')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'entity1',
      'Basic Template',
      {},
      { title: 'Entity 1' },
      {
        en: {
          title: 'Entity 1 EN',
        },
        pt: {
          title: 'Entity 1 PT',
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'related_entity',
      'Related Template',
      {},
      { title: 'Related Entity' },
      {
        en: {
          title: 'Related Entity EN',
          metadata: {
            related_text: [factory.metadataValue('Related Text EN')],
          },
        },
        pt: {
          title: 'Related Entity PT',
          metadata: {
            related_text: [factory.metadataValue('Related Text PT')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'related_entity_2',
      'Related Template',
      {},
      { title: 'Related Entity 2' },
      {
        en: {
          title: 'Related Entity 2 EN',
          metadata: {
            related_text: [factory.metadataValue('Related Text 2 EN')],
          },
        },
        pt: {
          title: 'Related Entity 2 PT',
          metadata: {
            related_text: [factory.metadataValue('Related Text 2 PT')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'full_entity',
      'Full Template',
      {},
      { title: 'Full Entity' },
      {
        en: {
          title: 'Full Entity EN',
          metadata: {
            text: [factory.metadataValue('Some text value')],
            numeric: [factory.metadataValue(42)],
            markdown: [factory.metadataValue('Some **markdown**')],
            generatedid: [factory.metadataValue('GEN-123')],
            date: [factory.metadataValue(1609459200)],
            multidate: [factory.metadataValue(1609459200), factory.metadataValue(1612137600)],
            daterange: [factory.metadataValue({ from: 1609459200, to: 1612137600 })],
            multidaterange: [
              factory.metadataValue({ from: 1609459200, to: 1612137600 }),
              factory.metadataValue({ from: 1614556800, to: 1617235200 }),
            ],
            link: [factory.metadataValue({ url: 'https://uwazi.io', label: 'Uwazi' })],
            image: [factory.metadataValue('https://example.com/image.jpg')],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            select: [{ value: 'red_id', label: 'Red in English' }],
            multiselect: [
              { value: 'red_id', label: 'Red in English' },
              { value: 'blue_id', label: 'Blue in English' },
            ],
            relationship: [
              {
                value: 'related_entity',
                label: 'Related Entity EN',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [factory.metadataValue('Related Text EN')],
              },
            ],
            nested: [
              factory.metadataValue({
                //@ts-ignore
                child_text: [factory.metadataValue('Child text value')],
                child_number: [factory.metadataValue(100)],
              }),
            ],
            preview: [],
            media: [factory.metadataValue('https://example.com/video.mp4')],
          },
          permissions: [],
          published: false,
        },
        pt: {
          title: 'Full Entity PT',
          metadata: {
            text: [factory.metadataValue('Some text value')],
            numeric: [factory.metadataValue(42)],
            markdown: [factory.metadataValue('Some **markdown**')],
            generatedid: [factory.metadataValue('GEN-123')],
            date: [factory.metadataValue(1609459200)],
            multidate: [factory.metadataValue(1609459200), factory.metadataValue(1612137600)],
            daterange: [factory.metadataValue({ from: 1609459200, to: 1612137600 })],
            multidaterange: [
              factory.metadataValue({ from: 1609459200, to: 1612137600 }),
              factory.metadataValue({ from: 1614556800, to: 1617235200 }),
            ],
            link: [factory.metadataValue({ url: 'https://uwazi.io', label: 'Uwazi' })],
            image: [factory.metadataValue('https://example.com/image.jpg')],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            select: [{ value: 'red_id', label: 'Red in Portuguese' }],
            multiselect: [
              { value: 'red_id', label: 'Red in Portuguese' },
              { value: 'blue_id', label: 'Blue in Portuguese' },
            ],
            relationship: [
              {
                value: 'related_entity',
                label: 'Related Entity PT',
                type: 'entity',
                inheritedType: 'text',
                inheritedValue: [factory.metadataValue('Related Text PT')],
              },
            ],
            nested: [
              factory.metadataValue({
                //@ts-ignore
                child_text: [factory.metadataValue('Child text value')],
                child_number: [factory.metadataValue(100)],
              }),
            ],
            preview: [],
            media: [factory.metadataValue('https://example.com/video.mp4')],
          },
          permissions: [],
          published: false,
        },
      }
    ),
  ],

  files: [
    factory.document('entity1_doc1', {
      entity: 'entity1',
      originalname: 'Document 1.pdf',
      language: 'en',
      mimetype: 'application/pdf',
      size: 100000,
      creationDate: 1609459200000,
      status: 'ready',
    }),
    {
      _id: factory.id('entity1_doc1_thumbnail'),
      entity: 'entity1',
      type: 'thumbnail',
      filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
      language: 'en',
      mimetype: 'image/jpeg',
      size: 10000,
      creationDate: 1609459200000,
    },
    factory.document('entity1_doc2', {
      entity: 'entity1',
      originalname: 'Document 2.pdf',
      language: 'en',
      mimetype: 'application/pdf',
      size: 150000,
      status: 'ready',
      creationDate: 1609459200000,
    }),
    {
      _id: factory.id('entity1_doc2_thumbnail'),
      entity: 'entity1',
      type: 'thumbnail',
      filename: `${factory.id('entity1_doc2').toHexString()}.jpg`,
      language: 'en',
      mimetype: 'image/jpeg',
      size: 12000,
      creationDate: 1609459200000,
    },
    factory.attachment('entity1_attach1', {
      entity: 'entity1',
      originalname: 'Attachment 1.txt',
      language: 'en',
      mimetype: 'text/plain',
      size: 5000,
      creationDate: 1609459200000,
    }),
  ],
};

class SampleListener extends Listener<any> {
  static eventName = EntityUpdatedEvent.name;

  // eslint-disable-next-line class-methods-use-this
  protected async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export { fixtures, SampleListener, factory };
