/* eslint-disable max-statements */
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { ObjectId } from 'mongodb';
import { Template } from 'api/core/domain/template/Template';
import { RelationshipPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/RelationshipPropertyAssignmentCreatorService';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  relationtypes: [
    {
      _id: factory.id('Document A to Document B'),
      name: 'Document A to Document B',
      properties: [],
      __v: 0,
    },
  ],

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
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Apple',
      language: 'en',
      value: 'Apple',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Banana',
      language: 'en',
      value: 'Banana',
    },
    {
      _id: new ObjectId(),
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
      key: 'Fruits',
      language: 'en',
      value: 'Fruits',
    },

    {
      _id: new ObjectId(),
      key: 'Apple',
      value: 'Apple in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Banana',
      value: 'Banana in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },
    {
      _id: new ObjectId(),
      key: 'Fruits',
      value: 'Fruits in Portuguese',
      language: 'pt',
      context: {
        type: 'Thesaurus',
        label: 'Fruits',
        id: factory.id('Fruits').toHexString(),
      },
    },
  ],

  dictionaries: [
    factory.thesauri('Fruits', [
      ['apple_id', 'Apple'],
      ['banana_id', 'Banana'],
    ]),
  ],

  templates: [
    factory.template('Document A', [
      factory.property('text_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('text').toHexString(),
          type: 'text',
        },
      }),
      factory.property('numeric_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('numeric').toHexString(),
          type: 'numeric',
        },
      }),
      factory.property('date_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('date').toHexString(),
          type: 'date',
        },
      }),
      factory.property('daterange_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('daterange').toHexString(),
          type: 'daterange',
        },
      }),
      factory.property('geolocation_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('geolocation_geolocation').toHexString(),
          type: 'geolocation',
        },
      }),
      factory.property('markdown_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('markdown').toHexString(),
          type: 'markdown',
        },
      }),
      factory.property('multidate_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('multidate').toHexString(),
          type: 'multidate',
        },
      }),
      factory.property('multidaterange_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('multidaterange').toHexString(),
          type: 'multidaterange',
        },
      }),
      factory.property('select_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('select').toHexString(),
          type: 'select',
        },
      }),
      factory.property('multiselect_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('multiselect').toHexString(),
          type: 'multiselect',
        },
      }),
      factory.property('link_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('link').toHexString(),
          type: 'link',
        },
      }),
      factory.property('image_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('image').toHexString(),
          type: 'image',
        },
      }),
      factory.property('generatedid_rel', 'relationship', {
        relationType: factory.id('Document A to Document B').toHexString(),
        content: factory.id('Document B').toHexString(),
        inherit: {
          property: factory.id('generatedid').toHexString(),
          type: 'generatedid',
        },
      }),
      factory.relationshipProp('rel_prop_no_inherit', 'Document B'),
    ]),

    factory.template('Document B', [
      factory.property('text', 'text'),
      factory.property('numeric', 'numeric'),
      factory.property('date', 'date'),
      factory.property('daterange', 'daterange'),
      factory.property('geolocation_geolocation', 'geolocation'),
      factory.property('markdown', 'markdown'),
      factory.property('multidate', 'multidate'),
      factory.property('multidaterange', 'multidaterange'),
      factory.property('select', 'select', { content: factory.id('Fruits').toHexString() }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('Fruits').toHexString(),
      }),
      factory.property('link', 'link'),
      factory.property('image', 'image'),
      factory.property('generatedid', 'generatedid'),

      // factory.property('preview', 'preview'), // Todo: not tested yet
      // factory.property('media', 'media'), // Todo: not tested yet
      // factory.property('nested', 'nested'),// Todo: not tested yet
    ]),

    factory.template('Document C', []),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'B1',
      'Document B',
      {},
      { title: 'B1', icon: { _id: 'iconB1', label: 'iconB1', type: 'img' } },
      {
        en: {
          title: 'B1 EN',
          metadata: {
            text: [factory.metadataValue('Text EN')],
            numeric: [factory.metadataValue(10)],
            date: [factory.metadataValue(1761935443)],
            daterange: [factory.metadataValue({ from: 1761935443, to: 1862021843 })],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            markdown: [factory.metadataValue('Markdown EN')],
            multidate: [factory.metadataValue(1761935443), factory.metadataValue(1862021843)],
            multidaterange: [
              factory.metadataValue({ from: 1761935443, to: 1862021843 }),
              factory.metadataValue({ from: 1761935443, to: 1862021843 }),
            ],
            select: [{ value: 'apple_id', label: 'Apple' }],
            multiselect: [
              { value: 'apple_id', label: 'Apple' },
              { value: 'banana_id', label: 'Banana' },
            ],
            link: [{ value: 'http://example.com', label: 'Example EN' }],
            image: [{ value: 'api/files/image.png' }],
            generatedid: [{ value: 'TIJ5481-7165' }],
          },
        },
        pt: {
          title: 'B1 PT',
          metadata: {
            text: [factory.metadataValue('Text PT')],
            numeric: [factory.metadataValue(10)],
            date: [factory.metadataValue(1761935443)],
            daterange: [factory.metadataValue({ from: 1761935443, to: 1862021843 })],
            geolocation_geolocation: [factory.metadataValue({ lat: 10, lon: 20 })],
            markdown: [factory.metadataValue('Markdown PT')],
            multidate: [factory.metadataValue(1761935443), factory.metadataValue(1862021843)],
            multidaterange: [
              factory.metadataValue({ from: 1761935443, to: 1862021843 }),
              factory.metadataValue({ from: 1761935443, to: 1862021843 }),
            ],
            select: [{ value: 'apple_id', label: 'Apple in Portuguese' }],
            multiselect: [
              { value: 'apple_id', label: 'Apple in Portuguese' },
              { value: 'banana_id', label: 'Banana in Portuguese' },
            ],
            link: [{ value: 'http://example.com', label: 'Example PT' }],
            image: [{ value: 'api/files/image.png' }],
            generatedid: [{ value: 'TIJ5481-7165' }],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'pt'],
      'B2',
      'Document B',
      {},
      { title: 'B2' },
      {
        en: {
          title: 'B2 EN',
          metadata: {
            text: [factory.metadataValue('B2 Text EN')],
          },
        },
        pt: {
          title: 'B2 PT',
          metadata: {
            text: [factory.metadataValue('B2 Text PT')],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(['en', 'pt'], 'C1', 'Document C'),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();

  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

  const multiLanguageEntityDS = new MongoMultiLanguageEntityDataSource(
    getConnection(),
    transactionManager,
    templatesDS
  );

  const settingsDS = SettingsDataSourceFactory.default(transactionManager);

  const sut = new RelationshipPropertyAssignmentCreatorService({
    multiLanguageEntityDS,
    settingsDS,
  });

  return { sut };
};

describe('RelationshipPropertyAssignmentCreatorService', () => {
  let sampleTemplate: Template;

  const getTemplate = async () => {
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document A') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    return template;
  };

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);

    sampleTemplate = await getTemplate();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create one property assignment per language with localized labels, icons and inherited values', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: {
        name: 'text_rel',
        value: [{ value: 'B1' }, { value: 'B2' }],
      },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'text_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text EN' }],
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
          {
            icon: undefined,
            value: 'B2',
            label: 'B2 EN',
            inheritedType: 'text',
            inheritedValue: [{ value: 'B2 Text EN' }],
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'text_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text PT' }],
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
          {
            icon: undefined,
            value: 'B2',
            label: 'B2 PT',
            inheritedType: 'text',
            inheritedValue: [{ value: 'B2 Text PT' }],
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for text inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'text_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'text_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'Text EN' }],
            inheritedType: 'text',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'text_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'Text PT' }],
            inheritedType: 'text',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for numeric inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'numeric_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'numeric_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 10 }],
            inheritedType: 'numeric',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'numeric_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 10 }],
            inheritedType: 'numeric',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for date inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'date_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'date_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 1761935443 }],
            inheritedType: 'date',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'date_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 1761935443 }],
            inheritedType: 'date',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for date range inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'daterange_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'daterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: { from: 1761935443, to: 1862021843 } }],
            inheritedType: 'daterange',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'daterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: { from: 1761935443, to: 1862021843 } }],
            inheritedType: 'daterange',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for date range inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'daterange_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'daterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: { from: 1761935443, to: 1862021843 } }],
            inheritedType: 'daterange',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'daterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: { from: 1761935443, to: 1862021843 } }],
            inheritedType: 'daterange',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for geolocation inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'geolocation_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'geolocation_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: { lat: 10, lon: 20 } }],
            inheritedType: 'geolocation',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'geolocation_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: { lat: 10, lon: 20 } }],
            inheritedType: 'geolocation',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for markdown inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'markdown_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'markdown_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'Markdown EN' }],
            inheritedType: 'markdown',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'markdown_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'Markdown PT' }],
            inheritedType: 'markdown',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for multi date inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'multidate_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'multidate_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 1761935443 }, { value: 1862021843 }],
            inheritedType: 'multidate',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'multidate_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 1761935443 }, { value: 1862021843 }],
            inheritedType: 'multidate',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for multi date range inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'multidaterange_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'multidaterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [
              { value: { from: 1761935443, to: 1862021843 } },
              { value: { from: 1761935443, to: 1862021843 } },
            ],
            inheritedType: 'multidaterange',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'multidaterange_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [
              { value: { from: 1761935443, to: 1862021843 } },
              { value: { from: 1761935443, to: 1862021843 } },
            ],
            inheritedType: 'multidaterange',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for select inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'select_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'select_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'apple_id', label: 'Apple' }],
            inheritedType: 'select',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'select_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'apple_id', label: 'Apple in Portuguese' }],
            inheritedType: 'select',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for multi select inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'multiselect_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'multiselect_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [
              { value: 'apple_id', label: 'Apple' },
              { value: 'banana_id', label: 'Banana' },
            ],
            inheritedType: 'multiselect',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'multiselect_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [
              { value: 'apple_id', label: 'Apple in Portuguese' },
              { value: 'banana_id', label: 'Banana in Portuguese' },
            ],
            inheritedType: 'multiselect',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for link inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'link_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'link_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'http://example.com', label: 'Example EN' }],
            inheritedType: 'link',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'link_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'http://example.com', label: 'Example PT' }],
            inheritedType: 'link',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for image inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'image_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'image_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'api/files/image.png' }],
            inheritedType: 'image',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'image_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'api/files/image.png' }],
            inheritedType: 'image',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments for generated id inherited property', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'generatedid_rel', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'generatedid_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedValue: [{ value: 'TIJ5481-7165' }],
            inheritedType: 'generatedid',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'generatedid_rel',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            inheritedValue: [{ value: 'TIJ5481-7165' }],
            inheritedType: 'generatedid',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should create property assignments when inheriting from another entity', async () => {
    const { sut } = createSut();

    const assignments = await sut.create({
      template: sampleTemplate,
      propertyAssignment: { name: 'rel_prop_no_inherit', value: [{ value: 'B1' }] },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
      {
        language: 'pt',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            icon: { id: 'iconB1', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should deduplicate and preserve input order, returning empty per-language assignments when no values provided', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document A') });
    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const assignments = await sut.create({
      template,
      propertyAssignment: {
        name: 'rel_prop_no_inherit',
        value: [{ value: 'B1' }, { value: 'B1' }, { value: 'B2' }],
      },
    });

    expect(assignments).toEqual([
      {
        language: 'en',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
          { value: 'B2', label: 'B2 EN', type: 'entity' },
        ],
      },
      {
        language: 'pt',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [
          {
            value: 'B1',
            label: 'B1 PT',
            icon: {
              id: 'iconB1',
              label: 'iconB1',
              type: 'img',
            },
            type: 'entity',
          },
          { value: 'B2', label: 'B2 PT', type: 'entity' },
        ],
      },
    ]);

    const empty = await sut.create({
      template,
      propertyAssignment: { name: 'rel_prop_no_inherit', value: [] },
    });

    expect(empty).toEqual([
      {
        language: 'en',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [],
      },
      {
        language: 'pt',
        name: 'rel_prop_no_inherit',
        type: 'relationship',
        value: [],
      },
    ]);
  });

  it('should validate existence and template content restriction', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document A') });
    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    // Missing sharedId
    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'text_rel', value: [{ value: 'MISSING' }] },
      })
    ).rejects.toThrow('references non-existent entities: MISSING');

    // Wrong template id for content restriction
    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'text_rel', value: [{ value: 'C1' }] },
      })
    ).rejects.toThrow('expects template');
  });
});
