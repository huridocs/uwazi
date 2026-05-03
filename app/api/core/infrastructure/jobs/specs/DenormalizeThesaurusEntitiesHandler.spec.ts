import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import { DenormalizeThesaurusEntitiesHandler } from '../DenormalizeThesaurusEntitiesHandler.js';
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

  const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });

  const sut = new DenormalizeThesaurusEntitiesHandler({ jobsDispatcher, entitiesDS });

  return { sut };
};

describe('DenormalizeThesaurusEntitiesHandler', () => {
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
      { tenantName: tenants.current().name, userId, thesaurusId },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    const jobs = await getJobs();

    expect(jobs).toMatchObject([
      {
        queue: 'uwazi_jobs',
        name: 'DenormalizeThesaurusEntitiesChunkHandler',
        params: {
          sharedIds: ['entity_1', 'entity_2', 'entity_6', 'entity_9'],
          tenantName: tenants.current().name,
          userId,
          thesaurusId,
        },
        namespace: tenants.current().name,
      },
    ]);
  });

  it('should do nothing when there are no affected entities', async () => {
    const { sut } = createSut();

    const thesaurusId = factory.id('thesaurus_3').toHexString();

    const userId = new ObjectId().toHexString();
    await sut.handleDispatch(
      jest.fn(),
      { tenantName: tenants.current().name, userId, thesaurusId },
      { namespace: tenants.current().name, maxRetries: 3, retryCount: 0 }
    );

    const jobs = await getJobs();

    expect(jobs).toMatchObject([]);
  });
});
