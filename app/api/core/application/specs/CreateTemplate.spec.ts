import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { TemplateWithDuplicatedNameOnTheSystemError } from 'api/core/domain/template/errors';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { LegacyTranslationService } from 'api/core/infrastructure/mongodb/template/LegacyTemplatesTranslationService';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { LegacyPageService } from 'api/core/infrastructure/mongodb/page/LegacyPageService';
import { CreateTemplateUseCase } from '../CreateTemplate';

const createSut = () => {
  const transactionManager = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;
  const settingsDS = DefaultSettingsDataSource(transactionManager);
  const translationService = new LegacyTranslationService();
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const pageService = new LegacyPageService();

  const sut = new CreateTemplateUseCase({
    templatesDS,
    idGenerator,
    thesauriDS: new MongoThesauriDataSource(),
    settingsDS,
    translationService,
    relationshipTypesDS,
    transactionManager,
    pageService,
  });

  return { sut };
};

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      newNameGeneration: true,
      project: 'cejil',
    },
  ],

  dictionaries: [
    {
      _id: factory.id('thesaurusId'),
      name: 'Fruits',
      values: [
        {
          label: 'Apple',
          id: 'ba0df33d-ab09-46be-9080-00575d0804d0',
        },
        {
          label: 'Banana',
          id: 'a4572c2b-502b-4d97-b706-4fcaceba1a31',
        },
        {
          label: 'Pineapple',
          id: '70c6493b-3aaa-4b03-a1ef-fc8a8bdd082d',
        },
      ],
      __v: 0,
    },
  ],
  relationtypes: [
    {
      _id: factory.id('relationTypeId'),
      name: 'Father -> Child',
      properties: [],
      __v: 0,
    },
  ],

  templates: [factory.template('targetedTemplate', [factory.property('date1', 'date')])],

  pages: [{ sharedId: 'existing_not_enabled', title: 'Page', entityView: false }],
};

describe('CreateTemplateUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'templates_spec_index.v2');
  });

  afterEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a Template', async () => {
    const { sut } = createSut();

    const output = await sut.execute({
      name: 'Template Name',
      properties: [
        { label: 'Text', type: 'text' },
        { label: 'Date', type: 'date' },
        { label: 'Date Range', type: 'daterange' },
        { label: 'Geolocation', type: 'geolocation' },
        { label: 'Image', type: 'image' },
        { label: 'Link', type: 'link' },
        { label: 'Markdown', type: 'markdown' },
        { label: 'Media', type: 'media' },
        { label: 'Multi Date', type: 'multidate' },
        { label: 'Multi Date Range', type: 'multidaterange' },
        { label: 'Numeric', type: 'numeric' },
        { label: 'Preview', type: 'preview' },
        { label: 'Generated Id', type: 'generatedid' },
        { label: 'Select', type: 'select', content: factory.id('thesaurusId').toHexString() },
        {
          label: 'Multi Select',
          type: 'multiselect',
          content: factory.id('thesaurusId').toHexString(),
        },
        {
          label: 'Relationship to any',
          type: 'relationship',
          relationType: factory.id('relationTypeId').toHexString(),
        },

        {
          label: 'Relationship to Property as target',
          type: 'relationship',
          relationType: factory.id('relationTypeId').toHexString(),
          content: factory.id('targetedTemplate').toHexString(),
          inherit: {
            property: factory.id('date1').toHexString(),
            type: 'date',
          },
        },
        { label: 'Nested', type: 'nested' },

        // { label: 'New Relationship', type: 'newRelationship' }, // missing
      ],
      commonProperties: [
        { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
        { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
        { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
      ],
      color: '#142134',
    });

    const created = (await testingEnvironment.db.getAllFrom('templates'))?.find(
      t => t._id.toHexString() === output.id
    );

    expect(created).toEqual({
      _id: expect.any(ObjectId),
      color: '#142134',
      name: 'Template Name',
      default: false,
      entityViewPage: '',
      processing: { active: false },
      commonProperties: [
        {
          _id: expect.any(ObjectId),
          type: 'text',
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          generatedId: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'date',
          label: 'Creation Date',
          name: 'creationDate',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'date',
          label: 'Edit Date',
          name: 'editDate',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          prioritySorting: false,
        },
      ],
      properties: [
        {
          _id: expect.any(ObjectId),
          type: 'text',
          label: 'Text',
          name: 'text',
          noLabel: false,
          required: false,
          showInCard: false,
          generatedId: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'date',
          label: 'Date',
          name: 'date',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'daterange',
          label: 'Date Range',
          name: 'date_range',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'geolocation',
          label: 'Geolocation',
          name: 'geolocation_geolocation',
          noLabel: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'image',
          label: 'Image',
          name: 'image',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'link',
          label: 'Link',
          name: 'link',
          noLabel: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'markdown',
          label: 'Markdown',
          name: 'markdown',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'media',
          label: 'Media',
          name: 'media',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'multidate',
          label: 'Multi Date',
          name: 'multi_date',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'multidaterange',
          label: 'Multi Date Range',
          name: 'multi_date_range',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'numeric',
          label: 'Numeric',
          name: 'numeric',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'preview',
          label: 'Preview',
          name: 'preview',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: expect.any(ObjectId),
          label: 'Generated Id',
          type: 'generatedid',
          name: 'generated_id',
          defaultfilter: false,
          filter: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'select',
          label: 'Select',
          name: 'select',
          content: factory.id('thesaurusId').toHexString(),
          defaultfilter: false,
          filter: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'multiselect',
          name: 'multi_select',
          label: 'Multi Select',
          content: factory.id('thesaurusId').toHexString(),
          defaultfilter: false,
          filter: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'relationship',
          name: 'relationship_to_any',
          label: 'Relationship to any',
          content: null,
          relationType: factory.id('relationTypeId').toHexString(),
          inherit: null,

          defaultfilter: false,
          filter: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },
        {
          _id: expect.any(ObjectId),
          type: 'relationship',
          content: factory.id('targetedTemplate').toHexString(),
          relationType: factory.id('relationTypeId').toHexString(),
          label: 'Relationship to Property as target',
          name: 'relationship_to_property_as_target',
          inherit: {
            property: factory.id('date1').toHexString(),
            type: 'date',
          },
          defaultfilter: false,
          filter: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },

        {
          _id: expect.any(ObjectId),
          defaultfilter: false,
          filter: false,
          label: 'Nested',
          name: 'nested_nested',
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
          type: 'nested',
        },
      ],
    });
  });

  it('should throw if Template name is not unique on the system', async () => {
    await testingEnvironment.setFixtures({
      ...fixtures,
      templates: [
        {
          color: '#142134',
          name: 'Template Name',
          default: false,
          commonProperties: [
            {
              type: 'text',
              label: 'Title',
              name: 'title',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              generatedId: false,
              prioritySorting: false,
            },
            {
              type: 'date',
              label: 'Creation Date',
              name: 'creationDate',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              prioritySorting: false,
            },
            {
              type: 'date',
              label: 'Edit Date',
              name: 'editDate',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              prioritySorting: false,
            },
          ],
          properties: [
            {
              type: 'text',
              label: 'Text',
              name: 'text',
              noLabel: false,
              required: false,
              showInCard: false,
              generatedId: false,
              filter: false,
              defaultfilter: false,
              prioritySorting: false,
            },
          ],
        },
      ],
    });

    const { sut } = createSut();

    await expect(
      sut.execute({
        name: 'Template Name',
        properties: [{ label: 'Text2', type: 'text' }],
        commonProperties: [
          { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
          { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
          { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
        ],
        color: '#142134',
      })
    ).rejects.toThrow(TemplateWithDuplicatedNameOnTheSystemError);

    const templates = await testingEnvironment.db.getAllFrom('templates');

    expect(templates).toHaveLength(1);
  });

  it('should throw if entity view page does not exist', async () => {
    const { sut } = createSut();
    await expect(
      sut.execute({
        name: 'Template Name',
        properties: [],
        commonProperties: [
          { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
          { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
          { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
        ],
        color: '#142134',
        entityViewPage: 'not_exists',
      })
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          message: 'The selected page does not exist',
          keyword: 'entityViewPageExists',
        }),
      ],
    });
  });

  it('should throw if entity view page is not enabled', async () => {
    const { sut } = createSut();
    await expect(
      sut.execute({
        name: 'Template Name',
        properties: [],
        commonProperties: [
          { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
          { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
          { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
        ],
        color: '#142134',
        entityViewPage: 'existing_not_enabled',
      })
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          message: 'The selected page is not enabled for entity view',
          keyword: 'entityViewPageIsEnabled',
        }),
      ],
    });
  });
});
