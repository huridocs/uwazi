import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import {
  DenormalizeEntitiesHandler,
  computeReferencingClosure,
} from '../DenormalizeEntitiesHandler.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { getSharedConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { EntitiesDataSourceFactory } from '../../factories/EntitiesDataSourceFactory.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],

  templates: [
    factory.template(
      'template_1',
      [
        factory.property('select', 'select', {
          content: factory.id('countries').toHexString(),
        }),
        factory.property('multiselect', 'multiselect', {
          content: factory.id('countries').toHexString(),
        }),
      ],
      { default: true }
    ),
    factory.template('template_2', [
      factory.property('select', 'select', {
        content: factory.id('thesaurus_2').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_2').toHexString(),
      }),
    ]),
    factory.template('template_3', [
      factory.inherit('relationship_1', 'template_1', 'select', {
        relationType: factory.id('rel2').toHexString(),
      }),

      factory.property('relationship_2', 'relationship', {
        content: factory.id('template_2').toHexString(),
      }),
      factory.property('select', 'select', {
        content: factory.id('countries').toHexString(),
      }),
    ]),
    factory.template('template_4', [
      factory.property('relationship_1', 'relationship', {
        content: factory.id('template_2').toHexString(),
      }),
    ]),
    factory.template('template_5', [
      factory.property('rel_to_template_1', 'relationship', {
        content: factory.id('template_1').toHexString(),
        inherit: {
          property: factory.id('select').toHexString(),
          type: 'select',
        },
        relationType: 'any_id',
      }),
    ]),
    factory.template('template_6', [
      factory.relationshipProp('rel_inherit_relationship', 'template_3', {
        inherit: {
          property: factory.id('relationship_1').toString(),
          type: 'relationship',
        },
      }),
    ]),
  ],

  entities: [
    // Template 1
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_1', 'template_1', {
      select: [{ value: factory.id('countries_canada').toString() }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_2', 'template_1', {
      multiselect: [{ value: factory.id('countries_europe').toString() }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_3', 'template_1'),

    // Template 2
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_4', 'template_2', {
      select: [{ value: factory.id('thesaurus_2_usa').toString() }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_5', 'template_2', {
      multiselect: [{ value: factory.id('thesaurus_2_usa').toString() }],
    }),

    // Template 3
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_6', 'template_3', {
      relationship_1: [
        {
          value: 'entity_1',
          inheritedType: 'select',
          inheritedValue: [{ value: factory.id('countries_canada').toString() }],
        },
      ],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_8', 'template_3', {
      relationship_1: [],
    }),

    // Template 4
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_7', 'template_4', {}),

    // Template 5
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_9', 'template_5', {
      rel_to_template_1: [
        {
          value: 'entity_1',
          inheritedType: 'select',
          inheritedValue: [{ value: factory.id('countries_canada').toString() }],
        },
      ],
    }),

    // Template 6
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_10', 'template_6', {
      rel_inherit_relationship: [
        {
          value: 'entity_6',
          inheritedType: 'relationship',
          inheritedValue: [{ value: 'entity_1' }],
        },
      ],
    }),
  ],

  dictionaries: [
    {
      _id: factory.id('countries'),
      name: 'Countries',
      values: [
        { id: factory.id('countries_usa').toString(), label: 'USA' },
        { id: factory.id('countries_canada').toString(), label: 'Canada' },
        {
          id: factory.id('countries_europe').toString(),
          label: 'Europe',
          values: [
            { id: factory.id('countries_france').toString(), label: 'France' },
            { id: factory.id('countries_germany').toString(), label: 'Germany' },
          ],
        },
      ],
    },
    {
      _id: factory.id('thesaurus_2'),
      name: 'thesaurus_2',
      values: [{ id: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
    },

    {
      _id: factory.id('thesaurus_3'),
      name: 'thesaurus_3',
      values: [],
    },
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

  const entitiesDS = testingEnvironment.runWithContext(() =>
    EntitiesDataSourceFactory.default({ transactionManager })
  );

  const sut = new DenormalizeEntitiesHandler({ jobsDispatcher, entitiesDS });

  return { sut };
};

describe('DenormalizeEntitiesHandler', () => {
  const getJobs = async () => getSharedConnection().collection('jobs').find().toArray();

  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await getSharedConnection().collection('jobs').deleteMany({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should dispatch jobs for affected entities', async () => {
    const { sut } = createSut();

    const thesaurusId = factory.id('countries').toHexString();

    const userId = new ObjectId().toHexString();
    await sut.handleDispatch(
      jest.fn(),
      {
        kind: 'thesaurus',
        tenantName: tenants.current().name,
        userId,
        thesaurusId,
        valueIds: [factory.id('countries_canada').toString()],
      },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    const jobs = await getJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      queue: 'uwazi_jobs',
      name: 'DenormalizeEntitiesChunkHandler',
      params: {
        kind: 'thesaurus',
        tenantName: tenants.current().name,
        userId,
        thesaurusId,
      },
      namespace: tenants.current().name,
    });
    expect([...jobs[0].params.sharedIds].sort()).toEqual(['entity_1', 'entity_6', 'entity_9']);
  });

  it('should dispatch relationship denormalization jobs for referencing entities', async () => {
    const { sut } = createSut();

    const userId = new ObjectId().toHexString();
    await sut.handleDispatch(
      jest.fn(),
      {
        kind: 'relationships',
        tenantName: tenants.current().name,
        userId,
        sharedIds: ['entity_1'],
      },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    const jobs = await getJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      queue: 'uwazi_jobs',
      name: 'DenormalizeEntitiesChunkHandler',
      params: {
        kind: 'relationships',
        tenantName: tenants.current().name,
        userId,
      },
      namespace: tenants.current().name,
    });
    expect([...jobs[0].params.sharedIds].sort()).toEqual(['entity_10', 'entity_6', 'entity_9']);
  });

  it('should do nothing when there are no affected entities', async () => {
    const { sut } = createSut();

    const thesaurusId = factory.id('thesaurus_3').toHexString();

    const userId = new ObjectId().toHexString();
    await sut.handleDispatch(
      jest.fn(),
      {
        kind: 'thesaurus',
        tenantName: tenants.current().name,
        userId,
        thesaurusId,
        valueIds: [],
      },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    const jobs = await getJobs();

    expect(jobs).toMatchObject([]);
  });

  it('should split the relationships closure into chunks of 100', async () => {
    const closure = Array.from({ length: 250 }, (_, i) => `entity-${i}`);
    const entitiesDS = {
      getSharedIdsUsingThesaurus: jest.fn(),
      getSharedIdsReferencing: jest.fn().mockResolvedValue(closure),
      getSharedIdsInheritingRelationshipFrom: jest.fn().mockResolvedValue([]),
    };
    const dispatched: Array<{ dispatchable: { name: string }; params: any }> = [];
    const jobsDispatcher = {
      dispatchMany: jest.fn(async (cb: any) =>
        cb((dispatchable: any, params: any) => dispatched.push({ dispatchable, params }))
      ),
    };

    const sut = new DenormalizeEntitiesHandler({
      entitiesDS: entitiesDS as any,
      jobsDispatcher: jobsDispatcher as any,
    });

    await sut.handleDispatch(
      jest.fn(),
      {
        kind: 'relationships',
        tenantName: tenants.current().name,
        userId: 'user-1',
        sharedIds: ['root'],
      },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    expect(dispatched).toHaveLength(3);
    expect(dispatched.map(d => d.dispatchable.name)).toEqual([
      'DenormalizeEntitiesChunkHandler',
      'DenormalizeEntitiesChunkHandler',
      'DenormalizeEntitiesChunkHandler',
    ]);
    expect(dispatched[0].params.sharedIds).toHaveLength(100);
    expect(dispatched[1].params.sharedIds).toHaveLength(100);
    expect(dispatched[2].params.sharedIds).toHaveLength(50);
  });
});

describe('computeReferencingClosure', () => {
  it('returns direct referencers followed by transitive inherit-from-relationship referencers', async () => {
    const getSharedIdsReferencing = jest.fn().mockResolvedValueOnce(['b']);
    const getSharedIdsInheritingRelationshipFrom = jest
      .fn()
      .mockResolvedValueOnce(['c'])
      .mockResolvedValueOnce([]);

    const result = await computeReferencingClosure(['a'], {
      getSharedIdsReferencing,
      getSharedIdsInheritingRelationshipFrom,
    });

    expect(result).toEqual(['b', 'c']);
    expect(getSharedIdsReferencing).toHaveBeenCalledTimes(1);
    expect(getSharedIdsReferencing).toHaveBeenCalledWith(['a']);
    expect(getSharedIdsInheritingRelationshipFrom).toHaveBeenNthCalledWith(1, ['b']);
    expect(getSharedIdsInheritingRelationshipFrom).toHaveBeenNthCalledWith(2, ['c']);
  });

  it('deduplicates across layers and never returns the roots', async () => {
    const getSharedIdsReferencing = jest.fn().mockResolvedValueOnce(['a', 'b']);
    const getSharedIdsInheritingRelationshipFrom = jest
      .fn()
      .mockResolvedValueOnce(['a', 'c'])
      .mockResolvedValueOnce(['b', 'c']);

    const result = await computeReferencingClosure(['a'], {
      getSharedIdsReferencing,
      getSharedIdsInheritingRelationshipFrom,
    });

    expect(result).toEqual(['b', 'c']);
  });

  it('returns only direct referencers when there is no transitive propagation', async () => {
    const getSharedIdsReferencing = jest.fn().mockResolvedValueOnce(['b']);
    const getSharedIdsInheritingRelationshipFrom = jest.fn().mockResolvedValueOnce([]);

    const result = await computeReferencingClosure(['a'], {
      getSharedIdsReferencing,
      getSharedIdsInheritingRelationshipFrom,
    });

    expect(result).toEqual(['b']);
  });

  it('returns an empty array when there are no direct referencers', async () => {
    const getSharedIdsReferencing = jest.fn().mockResolvedValueOnce([]);
    const getSharedIdsInheritingRelationshipFrom = jest.fn();

    const result = await computeReferencingClosure(['a'], {
      getSharedIdsReferencing,
      getSharedIdsInheritingRelationshipFrom,
    });

    expect(result).toEqual([]);
    expect(getSharedIdsInheritingRelationshipFrom).not.toHaveBeenCalled();
  });
});
