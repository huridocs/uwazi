/* eslint-disable max-lines */
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

const threeHopTextFixtures: DBFixture = {
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
    factory.template('templateD', [factory.property('text', 'text')]),
    factory.template('templateC', [
      factory.relationshipProp('rel_to_D', 'templateD', {
        inherit: { property: factory.idString('text'), type: 'text' },
      }),
    ]),
    factory.template('templateB', [
      factory.relationshipProp('rel_to_C', 'templateC', {
        inherit: { property: factory.idString('rel_to_D'), type: 'relationship' },
      }),
    ]),
    factory.template('templateA', [
      factory.relationshipProp('rel_to_B', 'templateB', {
        inherit: { property: factory.idString('rel_to_C'), type: 'relationship' },
      }),
    ]),
  ],
  entities: [
    factory.entity(
      'D1',
      'templateD',
      { text: [{ value: 'initial changed' }] },
      { title: 'D title' }
    ),
    factory.entity('C1', 'templateC', {
      rel_to_D: [
        {
          type: 'entity',
          value: 'D1',
          label: 'D title',
          inheritedType: 'text',
          inheritedValue: [{ value: 'initial' }],
        },
      ],
    }),
    factory.entity('B1', 'templateB', {
      rel_to_C: [
        {
          type: 'entity',
          value: 'C1',
          label: 'C1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              type: 'entity',
              value: 'D1',
              label: 'D title',
              inheritedType: 'text',
              inheritedValue: [{ value: 'initial' }],
            },
          ],
        },
      ],
    }),
    factory.entity('A1', 'templateA', {
      rel_to_B: [
        {
          type: 'entity',
          value: 'B1',
          label: 'B1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              type: 'entity',
              value: 'C1',
              label: 'C1',
              inheritedType: 'relationship',
              inheritedValue: [
                {
                  type: 'entity',
                  value: 'D1',
                  label: 'D title',
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'initial' }],
                },
              ],
            },
          ],
        },
      ],
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

  const getStored = async (sharedId: string, language: string) =>
    (await testingEnvironment.db.getAllFrom('entities')).find(
      doc => doc.sharedId === sharedId && doc.language === language
    );

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });
    });

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

    it('should denormalize inherited relationship values even when the referenced entity is stale', async () => {
      await testingEnvironment.setFixtures(twoHopFixtures);
      const sut = createSut(postgresCore);

      // B1 alone, with A1 still storing the stale label (e.g. A1's chunk job
      // has not committed yet in a parallel run).
      await sut.execute({ sharedIds: ['B1'] });

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

    it('should denormalize a text leaf through two relationship hops', async () => {
      await testingEnvironment.setFixtures(threeHopTextFixtures);
      const sut = createSut(postgresCore);

      await sut.execute({ sharedIds: ['B1'] });

      const stored = await getStored('B1', 'en');
      expect(stored?.metadata.rel_to_C).toMatchObject([
        {
          type: 'entity',
          value: 'C1',
          label: 'C1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              type: 'entity',
              value: 'D1',
              label: 'D title',
              inheritedType: 'text',
              inheritedValue: [{ value: 'initial changed' }],
            },
          ],
        },
      ]);
    });

    it('should denormalize a two-layer closure through two relationship hops', async () => {
      await testingEnvironment.setFixtures(threeHopTextFixtures);
      const sut = createSut(postgresCore);

      // The orchestrator closure for D1 is [C1, B1] (direct + one inherit layer).
      await sut.execute({ sharedIds: ['C1', 'B1'] });

      const b = await getStored('B1', 'en');
      expect(b?.metadata.rel_to_C).toMatchObject([
        {
          type: 'entity',
          value: 'C1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              type: 'entity',
              value: 'D1',
              inheritedType: 'text',
              inheritedValue: [{ value: 'initial changed' }],
            },
          ],
        },
      ]);
    });

    it('should not fetch the leaf beyond two relationship hops', async () => {
      await testingEnvironment.setFixtures(threeHopTextFixtures);
      const sut = createSut(postgresCore);

      // A1 is three hops from the text leaf D1 (A1 -> B1 -> C1 -> D1); with the
      // fetch capped at two hops, D1's fresh text must not be re-derived.
      await sut.execute({ sharedIds: ['A1'] });

      const a = await getStored('A1', 'en');
      expect(a?.metadata.rel_to_B[0].inheritedValue[0].inheritedValue[0].inheritedValue).toEqual([
        { value: 'initial' },
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
