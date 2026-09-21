import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { DenormalizeRelationshipsUseCaseFactory } from '#api/core/infrastructure/factories/DenormalizeRelationshipsUseCaseFactory.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  relationtypes: [factory.relationType('rel1')],
  templates: [
    factory.template('templateB', [factory.property('text', 'text')]),
    factory.template('templateA', [
      factory.relationshipProp('relationship', 'templateB'),
      factory.inherit('relationship_inherited', 'templateB', 'text'),
    ]),
  ],
  entities: [
    factory.entity(
      'B1',
      'templateB',
      { text: [{ value: 'text 1 changed' }] },
      { title: 'New Title B1', icon: { _id: 'icon_id', label: 'icon_label', type: 'image' } }
    ),
    factory.entity('B2', 'templateB', {}, { title: 'New Title B2' }),
    factory.entity('A1', 'templateA', {
      relationship: [factory.metadataValue('B1', 'stale label')],
      relationship_inherited: [factory.metadataValue('B1', 'stale label')],
    }),
  ],
};

const twoHopFixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  relationtypes: [factory.relationType('rel1')],
  templates: [
    factory.template('templateX', [factory.property('text', 'text')]),
    factory.template('templateA', [factory.relationshipProp('rel_to_X', 'templateX')]),
    factory.template('templateB', [
      factory.relationshipProp('rel_to_A', 'templateA', {
        inherit: { property: factory.idString('rel_to_X'), type: 'relationship' },
      }),
    ]),
  ],
  entities: [
    factory.entity('X1', 'templateX', { text: [{ value: 'text v2' }] }, { title: 'New Title X1' }),
    factory.entity('A1', 'templateA', { rel_to_X: [factory.metadataValue('X1', 'stale label')] }),
    factory.entity('B1', 'templateB', { rel_to_A: [factory.metadataValue('A1', 'stale label')] }),
  ],
};

type TestConfig = {
  name: string;
  postgresCore: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

const createSut = (postgresCore = false) => {
  const contextOverrides: any = {};
  if (postgresCore) {
    contextOverrides.tenant = {
      ...testingTenants.current(),
      featureFlags: { postgresCore: true },
    };
  }

  const { sut } = testingEnvironment.runWithContext(
    () => ({ sut: DenormalizeRelationshipsUseCaseFactory.default() }),
    contextOverrides
  );

  return sut;
};

describe('DenormalizeRelationships', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });
    });

    const getStored = async (sharedId: string, language: string) =>
      (await testingEnvironment.db.getAllFrom('entities')).find(
        doc => doc.sharedId === sharedId && doc.language === language
      );

    it('should denormalize label and icon on referencing entities', async () => {
      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['A1'] });

      const stored = await getStored('A1', 'en');
      expect(stored?.metadata.relationship).toMatchObject([
        {
          type: 'entity',
          value: 'B1',
          label: 'New Title B1',
          icon: { _id: 'icon_id', label: 'icon_label', type: 'image' },
        },
      ]);
    });

    it('should denormalize inherited property values', async () => {
      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['A1'] });

      const stored = await getStored('A1', 'en');
      expect(stored?.metadata.relationship_inherited).toMatchObject([
        {
          type: 'entity',
          value: 'B1',
          label: 'New Title B1',
          inheritedType: 'text',
          inheritedValue: [{ value: 'text 1 changed' }],
        },
      ]);
    });

    it('should denormalize across all entity languages', async () => {
      await testingEnvironment.setFixtures({
        ...fixtures,
        entities: [
          ...factory.entityInMultipleLanguages(
            ['en', 'es'],
            'B1',
            'templateB',
            { text: [{ value: 'text 1 changed' }] },
            { title: 'Title EN' },
            { es: { title: 'Title ES' } }
          ),
          ...factory.entityInMultipleLanguages(['en', 'es'], 'A1', 'templateA', {
            relationship: [factory.metadataValue('B1', 'stale label')],
          }),
        ],
      });

      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['A1'] });

      const en = await getStored('A1', 'en');
      const es = await getStored('A1', 'es');

      expect(en?.metadata.relationship[0].label).toBe('Title EN');
      expect(es?.metadata.relationship[0].label).toBe('Title ES');
    });

    it('should do nothing when there are no entities to denormalize', async () => {
      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['missing-entity'] });

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored).toHaveLength(3);
    });

    it('should denormalize inherited relationship values from the same batch (two hops)', async () => {
      await testingEnvironment.setFixtures(twoHopFixtures);
      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['A1', 'B1'] });

      const stored = await getStored('B1', 'en');
      expect(stored?.metadata.rel_to_A).toMatchObject([
        {
          type: 'entity',
          value: 'A1',
          label: 'A1',
          inheritedType: 'relationship',
          inheritedValue: [{ type: 'entity', value: 'X1', label: 'New Title X1' }],
        },
      ]);
    });

    it('should opt out of re-dispatching relationship denormalization', async () => {
      const mockedUpdate = jest.fn().mockResolvedValue([]);

      const contextOverrides: any = postgresCore
        ? { tenant: { ...testingTenants.current(), featureFlags: { postgresCore: true } } }
        : {};

      const { sut } = testingEnvironment.runWithContext(
        () => ({
          sut: DenormalizeRelationshipsUseCaseFactory.default({
            entitiesService: { update: mockedUpdate } as any,
          }),
        }),
        contextOverrides
      );

      await sut.execute({ sharedIds: ['A1'] });

      expect(mockedUpdate).toHaveBeenCalledTimes(1);
      expect(mockedUpdate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          authorize: false,
          denormalizeRelationships: false,
        })
      );
    });
  });
});
