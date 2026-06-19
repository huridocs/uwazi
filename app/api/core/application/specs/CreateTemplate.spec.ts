import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TemplateWithDuplicatedNameOnTheSystemError } from '#api/core/domain/template/errors.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { CreateTemplateUseCaseFactory } from '#api/core/infrastructure/factories/CreateTemplateUseCaseFactory.js';
import { LegacyTranslationService } from '#api/core/infrastructure/mongodb/template/LegacyTemplatesTranslationService.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource.js';

type TestConfig = {
  name: string;
  postgresTemplates: boolean;
  getTemplates: () => Promise<any[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresTemplates: false,
    getTemplates: async () => testingEnvironment.db.getAllFrom('templates') as Promise<any[]>,
  },
  {
    name: 'Postgres',
    postgresTemplates: true,
    getTemplates: async () =>
      testingEnvironment.pg
        .getAllFrom('templates')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest) as any[]),
  },
];

type CreateProps = {
  thesauriDS?: ThesauriDataSource;
  translationService?: LegacyTranslationService;
};

const createSut = (props?: CreateProps, postgresTemplates = false) =>
  testingEnvironment.runWithContext(
    () => {
      const sut = CreateTemplateUseCaseFactory.default({
        ...(props?.translationService ? { translationService: props.translationService } : {}),
      });

      return { sut };
    },
    postgresTemplates
      ? {
          tenant: {
            ...testingTenants.current(),
            featureFlags: { postgresTemplates: true },
          },
        }
      : undefined
  );

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

  pages: [
    {
      _id: factory.id('entityViewPageDisabled'),
      sharedId: 'existing_not_enabled',
      entityView: false,
      creationDate: 1,
      locales: {
        en: {
          title: 'Page',
          draft: { content: '', script: '', css: '' },
        },
      },
    },
  ],
};

describe('CreateTemplateUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, {
      elasticIndex: 'templates_spec_index.v2',
      postgres: true,
    });
  });

  afterEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTemplates, getTemplates }) => {
    it('should create a Template', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      const output = await sut.execute({
        name: 'Template Name',
        properties: [
          { label: 'Text', type: PropertyTypeEnum.Text },
          { label: 'Date', type: PropertyTypeEnum.Date },
          { label: 'Date Range', type: PropertyTypeEnum.DateRange },
          { label: 'Geolocation', type: PropertyTypeEnum.Geolocation },
          { label: 'Image', type: PropertyTypeEnum.Image },
          { label: 'Link', type: PropertyTypeEnum.Link },
          { label: 'Markdown', type: PropertyTypeEnum.Markdown },
          { label: 'Media', type: PropertyTypeEnum.Media },
          { label: 'Multi Date', type: PropertyTypeEnum.MultiDate },
          { label: 'Multi Date Range', type: PropertyTypeEnum.MultiDateRange },
          { label: 'Numeric', type: PropertyTypeEnum.Numeric },
          { label: 'Preview', type: PropertyTypeEnum.Preview },
          { label: 'Generated Id', type: PropertyTypeEnum.GeneratedId },
          {
            label: 'Select',
            type: PropertyTypeEnum.Select,
            content: factory.id('thesaurusId').toHexString(),
          },
          {
            label: 'Multi Select',
            type: PropertyTypeEnum.MultiSelect,
            content: factory.id('thesaurusId').toHexString(),
          },
          {
            label: 'Relationship to any',
            type: PropertyTypeEnum.Relationship,
            relationType: factory.id('relationTypeId').toHexString(),
          },

          {
            label: 'Relationship to Property as target',
            type: PropertyTypeEnum.Relationship,
            relationType: factory.id('relationTypeId').toHexString(),
            content: factory.id('targetedTemplate').toHexString(),
            inherit: {
              property: factory.id('date1').toHexString(),
              type: PropertyTypeEnum.Date,
            },
          },
          { label: 'Nested', type: PropertyTypeEnum.Nested },

          // { label: 'New Relationship', type: PropertyTypeEnum.newRelationship }, // missing
        ],
        commonProperties: [
          { label: 'Title', type: PropertyTypeEnum.Text, name: 'title', isCommonProperty: true },
          {
            label: 'Creation Date',
            type: PropertyTypeEnum.Date,
            name: 'creationDate',
            isCommonProperty: true,
          },
          {
            label: 'Edit Date',
            type: PropertyTypeEnum.Date,
            name: 'editDate',
            isCommonProperty: true,
          },
        ],
        color: '#142134',
      });

      const created = (await getTemplates()).find(t => t._id.toString() === output.id);

      expect(created).toMatchObject({
        color: '#142134',
        name: 'Template Name',
        default: false,
        entityViewPage: '',
        processing: { active: false },
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
          {
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
            type: 'geolocation',
            label: 'Geolocation',
            name: 'geolocation_geolocation',
            noLabel: false,
            required: false,
            showInCard: false,
          },
          {
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
            type: 'link',
            label: 'Link',
            name: 'link',
            noLabel: false,
            required: false,
            showInCard: false,
          },
          {
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
            type: 'relationship',
            name: 'relationship_to_any',
            label: 'Relationship to any',
            content: '',
            relationType: factory.id('relationTypeId').toHexString(),

            defaultfilter: false,
            filter: false,
            noLabel: false,
            prioritySorting: false,
            required: false,
            showInCard: false,
          },
          {
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
            defaultfilter: false,
            nestedProperties: [],
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

      const { sut } = createSut(undefined, postgresTemplates);

      await expect(
        sut.execute({
          name: 'Template Name',
          properties: [{ label: 'Text2', type: PropertyTypeEnum.Text }],
          commonProperties: [
            { label: 'Title', type: PropertyTypeEnum.Text, name: 'title', isCommonProperty: true },
            {
              label: 'Creation Date',
              type: PropertyTypeEnum.Date,
              name: 'creationDate',
              isCommonProperty: true,
            },
            {
              label: 'Edit Date',
              type: PropertyTypeEnum.Date,
              name: 'editDate',
              isCommonProperty: true,
            },
          ],
          color: '#142134',
        })
      ).rejects.toThrow(TemplateWithDuplicatedNameOnTheSystemError);

      const templates = await getTemplates();

      expect(templates).toHaveLength(1);
    });

    it('should throw if entity view page does not exist', async () => {
      const { sut } = createSut(undefined, postgresTemplates);
      await expect(
        sut.execute({
          name: 'Template Name',
          properties: [],
          commonProperties: [
            { label: 'Title', type: PropertyTypeEnum.Text, name: 'title', isCommonProperty: true },
            {
              label: 'Creation Date',
              type: PropertyTypeEnum.Date,
              name: 'creationDate',
              isCommonProperty: true,
            },
            {
              label: 'Edit Date',
              type: PropertyTypeEnum.Date,
              name: 'editDate',
              isCommonProperty: true,
            },
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
      const { sut } = createSut(undefined, postgresTemplates);
      await expect(
        sut.execute({
          name: 'Template Name',
          properties: [],
          commonProperties: [
            { label: 'Title', type: PropertyTypeEnum.Text, name: 'title', isCommonProperty: true },
            {
              label: 'Creation Date',
              type: PropertyTypeEnum.Date,
              name: 'creationDate',
              isCommonProperty: true,
            },
            {
              label: 'Edit Date',
              type: PropertyTypeEnum.Date,
              name: 'editDate',
              isCommonProperty: true,
            },
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

    if (postgresTemplates) {
      it('should NOT revert the PG write when the Mongo transaction rolls back', async () => {
        const translationService = TestUtils.mockClass<LegacyTranslationService>({
          createTemplateTranslation: jest.fn().mockRejectedValue(new Error('Creation failed')),
        });

        const { sut } = createSut({ translationService }, postgresTemplates);

        await expect(
          sut.execute({
            name: 'Failing Template',
            properties: [{ label: 'Text', type: PropertyTypeEnum.Text }],
            commonProperties: [
              {
                label: 'Title',
                type: PropertyTypeEnum.Text,
                name: 'title',
                isCommonProperty: true,
              },
              {
                label: 'Creation Date',
                type: PropertyTypeEnum.Date,
                name: 'creationDate',
                isCommonProperty: true,
              },
              {
                label: 'Edit Date',
                type: PropertyTypeEnum.Date,
                name: 'editDate',
                isCommonProperty: true,
              },
            ],
          })
        ).rejects.toThrow('Creation failed');

        const templates = await getTemplates();
        expect(templates.some(t => t.name === 'Failing Template')).toBe(true);
      });
    }
  });
});
