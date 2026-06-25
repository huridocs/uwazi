import { TestUtils } from '#api/common.v2/utils/Test.js';
import { InheritedPropertyCanNotBeDeleted } from '#api/core/domain/template/errors.js';
import { TemplateUpdatedEvent } from '#api/core/domain/template/events/TemplateUpdatedEvent.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { UpdateTemplateUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTemplateUseCaseFactory.js';
import { LegacyTranslationService } from '#api/core/infrastructure/mongodb/template/LegacyTemplatesTranslationService.js';
import { spyOnEmit } from '#api/core/libs/eventsbus/eventTesting.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  templateToBeInherited,
  templateInheritingFromAnother,
  propertyToBeInherited,
  relatedTo,
} from '#api/core/v1_layer/templates/specs/fixtures/fixtures.js';

const factory = getFixturesFactory();

const templateToBeEditedId = factory.id('template to be edited');

const defaultCommonProperties = (suffix = '') => [
  {
    label: 'Title',
    type: PropertyTypeEnum.Text as const,
    name: 'title',
    id: factory.id(`title${suffix}`).toString(),
    isCommonProperty: true as const,
  },
  {
    label: 'Creation Date',
    type: PropertyTypeEnum.Date as const,
    name: 'creationDate',
    id: factory.id(`creationDate${suffix}`).toString(),
    isCommonProperty: true as const,
  },
  {
    label: 'Edit date',
    type: PropertyTypeEnum.Date as const,
    name: 'editDate',
    id: factory.id(`editDate${suffix}`).toString(),
    isCommonProperty: true as const,
  },
];

const fixtures: DBFixture = {
  settings: [
    {
      newNameGeneration: true,
      project: 'cejil',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  dictionaries: [
    {
      ...factory.thesauri('Fruits', [['ba0df33d-ab09-46be-9080-00575d0804d0', 'Apple']]),
      _id: factory.id('thesaurusId'),
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
  templates: [
    factory.template('targetedTemplate', [factory.property('date1', 'date')]),
    factory.template(
      'template to be edited',
      [factory.property('text_property', 'text'), factory.property('numeric_property', 'numeric')],
      {
        default: true,
        color: '',
        entityViewPage: '',
      }
    ),
    factory.template(
      'template to be inherited',
      [
        {
          ...factory.property('inherit_me', 'text'),
          _id: propertyToBeInherited,
        },
      ],
      {
        _id: templateToBeInherited,
        default: false,
      }
    ),
    factory.template(
      'template inheriting from another',
      [
        {
          ...factory.property('inherit', 'relationship', {
            relationType: relatedTo.toString(),
            content: templateToBeInherited.toString(),
            inherit: {
              property: propertyToBeInherited.toString(),
              type: 'text',
            },
          }),
          _id: factory.id('inherit_prop'),
          label: 'Inherit',
        },
      ],
      {
        _id: templateInheritingFromAnother,
        default: false,
      }
    ),
  ],
};

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

const createSut = (
  overrides?: { translationService?: LegacyTranslationService; dispatcher?: Dispatcher },
  postgresTemplates = false
) =>
  testingEnvironment.runWithContext(
    () => {
      const sut = UpdateTemplateUseCaseFactory.default({
        ...(overrides?.translationService
          ? { translationService: overrides.translationService }
          : {}),
        ...(overrides?.dispatcher ? { dispatcher: overrides.dispatcher } : {}),
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

describe('UpdateTemplateUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, {
      elasticIndex: 'update_template_spec_index.v2',
      postgres: true,
    });
  });

  afterEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTemplates, getTemplates }) => {
    it('should update a template name', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'Updated Name',
          properties: [
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
          ],
          commonProperties: defaultCommonProperties(),
          color: '#142134',
        },
        { language: 'en', fullReindex: false }
      );

      const templates = await getTemplates();
      const updated = templates.find(
        (t: any) => t._id.toString() === templateToBeEditedId.toString()
      );

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Name');
    });

    it('should update template properties', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'template to be edited',
          properties: [
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
            {
              label: 'Numeric Property',
              type: PropertyTypeEnum.Numeric,
              id: factory.id('numeric_property').toString(),
            },
            {
              label: 'New Date Property',
              type: PropertyTypeEnum.Date,
            },
          ],
          commonProperties: defaultCommonProperties(),
          color: '#142134',
        },
        { language: 'en', fullReindex: false }
      );

      const templates = await getTemplates();
      const updated = templates.find(
        (t: any) => t._id.toString() === templateToBeEditedId.toString()
      );

      expect(updated).toBeDefined();
      expect(updated.properties).toHaveLength(3);
      expect(updated.properties[2].name).toBe('new_date_property');
    });

    it('should throw when trying to delete an inherited property', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      await expect(
        sut.execute(
          {
            id: templateToBeInherited.toString(),
            name: 'template to be inherited',
            properties: [],
            commonProperties: defaultCommonProperties('2'),
          },
          { language: 'en', fullReindex: false }
        )
      ).rejects.toBeInstanceOf(InheritedPropertyCanNotBeDeleted);
    });

    it('should not allow to swap property names', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      await expect(
        sut.execute(
          {
            id: templateToBeEditedId.toString(),
            name: 'template to be edited',
            properties: [
              {
                label: 'Text Property',
                type: PropertyTypeEnum.Text,
                id: factory.id('text_property').toString(),
              },
              {
                label: 'Text Property',
                type: PropertyTypeEnum.Numeric,
                id: factory.id('numeric_property').toString(),
              },
            ],
            commonProperties: defaultCommonProperties(),
          },
          { language: 'en', fullReindex: false }
        )
      ).rejects.toMatchObject({
        message: expect.stringContaining('Template contains duplicate property name'),
      });
    });

    it('should preserve property order when properties are reordered', async () => {
      const { sut } = createSut(undefined, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'template to be edited',
          properties: [
            {
              label: 'Numeric Property',
              type: PropertyTypeEnum.Numeric,
              id: factory.id('numeric_property').toString(),
            },
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
          ],
          commonProperties: defaultCommonProperties(),
        },
        { language: 'en', fullReindex: false }
      );

      const templates = await getTemplates();
      const updated = templates.find(
        (t: any) => t._id.toString() === templateToBeEditedId.toString()
      );

      expect(updated.properties).toHaveLength(2);
      expect(updated.properties[0].name).toBe('numeric_property');
      expect(updated.properties[1].name).toBe('text_property');
    });

    it('should dispatch postProcessTemplateEntities with correct params', async () => {
      await testingEnvironment.setFixtures({
        ...fixtures,
        entities: [
          ...(fixtures.entities || []),
          {
            sharedId: 'entity1',
            template: templateToBeEditedId,
            title: 'Entity 1',
            language: 'en',
            metadata: {},
          },
          {
            sharedId: 'entity2',
            template: templateToBeEditedId,
            title: 'Entity 2',
            language: 'en',
            metadata: {},
          },
        ],
      });

      const dispatchMock = jest.fn();
      const dispatcher = TestUtils.mockClass<Dispatcher>({
        postProcessTemplateEntities: jest.fn(async callback => {
          await callback(dispatchMock);
        }),
      });

      const { sut } = createSut({ dispatcher }, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'template to be edited',
          properties: [
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
          ],
          commonProperties: defaultCommonProperties(),
        },
        { language: 'en', fullReindex: false }
      );

      expect(dispatcher.postProcessTemplateEntities).toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: templateToBeEditedId.toString(),
          deletedProperties: ['numeric_property'],
          language: 'en',
          fullReindex: false,
          resaveForFilterChange: false,
          tenantName: expect.any(String),
          userId: expect.any(String),
        })
      );
    });

    it(`should emit a ${TemplateUpdatedEvent.name} event`, async () => {
      const emitSpy = spyOnEmit();
      const { sut } = createSut(undefined, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'Updated Name',
          properties: [
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
            {
              label: 'Numeric Property',
              type: PropertyTypeEnum.Numeric,
              id: factory.id('numeric_property').toString(),
            },
          ],
          commonProperties: defaultCommonProperties(),
        },
        { language: 'en', fullReindex: false }
      );

      emitSpy.expectToEmitEvent(TemplateUpdatedEvent);
    });

    it('should call dispatcher.postProcessTemplateEntities', async () => {
      const dispatcher = TestUtils.mockClass<Dispatcher>({
        postProcessTemplateEntities: jest.fn(),
      });
      const { sut } = createSut({ dispatcher }, postgresTemplates);

      await sut.execute(
        {
          id: templateToBeEditedId.toString(),
          name: 'Updated Name',
          properties: [
            {
              label: 'Text Property',
              type: PropertyTypeEnum.Text,
              id: factory.id('text_property').toString(),
            },
          ],
          commonProperties: defaultCommonProperties(),
        },
        { language: 'en', fullReindex: false }
      );

      expect(dispatcher.postProcessTemplateEntities).toHaveBeenCalled();
    });

    if (postgresTemplates) {
      it('should NOT revert the PG write when the Mongo transaction rolls back', async () => {
        const translationService = TestUtils.mockClass<LegacyTranslationService>({
          updateTemplateTranslation: jest.fn().mockRejectedValue(new Error('Update failed')),
        });

        const { sut } = createSut({ translationService }, postgresTemplates);

        await expect(
          sut.execute(
            {
              id: templateToBeEditedId.toString(),
              name: 'Failing Update',
              properties: [
                {
                  label: 'Text Property',
                  type: PropertyTypeEnum.Text,
                  id: factory.id('text_property').toString(),
                },
              ],
              commonProperties: defaultCommonProperties(),
            },
            { language: 'en', fullReindex: false }
          )
        ).rejects.toThrow('Update failed');

        const templates = await getTemplates();
        expect(templates.some((t: any) => t.name === 'Failing Update')).toBe(true);
      });
    }
  });
});
