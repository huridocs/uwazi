import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { User } from '#api/users.v2/model/User.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import type {
  EntitiesReadDAO,
  TemplatesReadDAO,
} from '#api/dataviz.v2/application/services/buildDatavizMultilingualLabelContext.js';
import { MongoDatavizQueryExecutor } from '../mongodb/MongoDatavizQueryExecutor.js';
import { PostgresDatavizQueryExecutor } from '../postgresql/PostgresDatavizQueryExecutor.js';
import { DatavizQueryOrchestrator } from '#api/dataviz.v2/application/services/DatavizQueryOrchestrator.js';
import type { DatavizQuery } from '#shared/types/datavizSchema.js';
import type { DatavizQueryContext } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const factory = getFixturesFactory();

const templateId = factory.id('carsTemplate');
const ownersTemplateId = factory.id('ownersTemplate');
const personasTemplateId = factory.id('personasTemplate');
const colorId = 'ba0df33d-ab09-46be-9080-00575d0804d0';
const unpublishedColorId = 'bb0df33d-ab09-46be-9080-00575d0804d1';
const countryId = 'c0ffee00-0000-4000-8000-000000000001';
const hombreId = 'a1000000-0000-4000-8000-000000000001';
const mujerId = 'a2000000-0000-4000-8000-000000000002';
const thesaurusId = factory.id('colorsThesaurus');
const countriesThesaurusId = factory.id('countriesThesaurus');
const sexThesaurusId = factory.id('sexThesaurus');
const featuresThesaurusId = factory.id('featuresThesaurus');
const languagesThesaurusId = factory.id('languagesThesaurus');
const featAId = 'feat-a';
const featBId = 'feat-b';
const langEnId = 'lang-en';
const langEsId = 'lang-es';

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  templates: [
    {
      _id: ownersTemplateId,
      name: 'Owners',
      properties: [
        factory.property('country', 'select', { content: countriesThesaurusId.toString() }),
        factory.property('date_of_birth', 'date'),
        factory.property('sex', 'select', { content: sexThesaurusId.toString() }),
        factory.property('languages', 'multiselect', {
          content: languagesThesaurusId.toString(),
        }),
        factory.property('period', 'daterange'),
      ],
      commonProperties: factory.commonProperties(),
    },
    {
      _id: personasTemplateId,
      name: 'Personas',
      properties: [
        factory.property('date_of_birth', 'date'),
        factory.property('sex', 'select', { content: sexThesaurusId.toString() }),
      ],
      commonProperties: factory.commonProperties(),
    },
    {
      _id: templateId,
      name: 'Cars',
      properties: [
        {
          _id: factory.id('colorProp'),
          label: 'Color',
          name: 'color',
          type: 'select',
          content: thesaurusId.toString(),
        },
        factory.inherit('owner', 'ownersTemplate', 'country'),
        factory.inherit('parent', 'ownersTemplate', 'languages'),
        factory.relationshipProp('garage', 'ownersTemplate'),
        factory.property('sexo', 'select', { content: sexThesaurusId.toString() }),
        factory.property('engine_size', 'numeric'),
        factory.property('features', 'multiselect', {
          content: featuresThesaurusId.toString(),
        }),
        factory.property('model_name', 'text'),
        factory.property('registered_on', 'date'),
      ],
      commonProperties: factory.commonProperties(),
    },
  ],
  dictionaries: [
    {
      _id: thesaurusId,
      name: 'Colors',
      values: [
        { id: colorId, label: 'Red' },
        { id: unpublishedColorId, label: 'Blue' },
      ],
    },
    {
      _id: countriesThesaurusId,
      name: 'Countries',
      values: [{ id: countryId, label: 'Argentina' }],
    },
    {
      _id: sexThesaurusId,
      name: 'Sex',
      values: [
        { id: hombreId, label: 'Hombre' },
        { id: mujerId, label: 'Mujer' },
      ],
    },
    {
      _id: featuresThesaurusId,
      name: 'Features',
      values: [
        { id: featAId, label: 'Feature A' },
        { id: featBId, label: 'Feature B' },
      ],
    },
    {
      _id: languagesThesaurusId,
      name: 'Languages',
      values: [
        { id: langEnId, label: 'English' },
        { id: langEsId, label: 'Spanish' },
      ],
    },
  ],
  entities: [
    {
      _id: factory.id('owner1'),
      sharedId: 'owner_shared_1',
      language: 'en',
      template: ownersTemplateId,
      title: 'Alice',
      published: true,
      metadata: {
        country: [{ value: countryId, label: 'Argentina' }],
        languages: [{ value: langEnId, label: 'English' }],
        period: [{ value: { from: 1577836800, to: 1583020800 } }],
      },
    },
    {
      _id: factory.id('owner2'),
      sharedId: 'owner_shared_2',
      language: 'en',
      template: ownersTemplateId,
      title: 'Bob',
      published: true,
      metadata: {
        country: [{ value: countryId, label: 'Argentina' }],
        date_of_birth: [{ value: 946684800 }],
        sex: [{ value: hombreId, label: 'Hombre' }],
        languages: [
          { value: langEnId, label: 'English' },
          { value: langEsId, label: 'Spanish' },
        ],
        period: [{ value: { from: 1609459200, to: 1625097600 } }],
      },
    },
    {
      _id: factory.id('owner3'),
      sharedId: 'owner_shared_3',
      language: 'en',
      template: ownersTemplateId,
      title: 'Carol',
      published: true,
      metadata: {
        country: [{ value: countryId, label: 'Argentina' }],
        date_of_birth: [{ value: 946684800 }],
        sex: [{ value: mujerId, label: 'Mujer' }],
        languages: [{ value: langEsId, label: 'Spanish' }],
        period: [{ value: { from: 1577836800, to: 1640995200 } }],
      },
    },
    {
      _id: factory.id('persona1'),
      sharedId: 'persona_shared_1',
      language: 'en',
      template: personasTemplateId,
      title: 'Diana',
      published: true,
      metadata: {
        date_of_birth: [{ value: 946684800 }],
        sex: [{ value: hombreId, label: 'Hombre' }],
      },
    },
    {
      _id: factory.id('persona2'),
      sharedId: 'persona_shared_2',
      language: 'en',
      template: personasTemplateId,
      title: 'Eve',
      published: true,
      metadata: {
        date_of_birth: [{ value: 1104537600 }],
        sex: [{ value: mujerId, label: 'Mujer' }],
      },
    },
    {
      _id: factory.id('entity1'),
      sharedId: 'shared1',
      language: 'en',
      template: templateId,
      title: 'Car 1',
      published: true,
      metadata: {
        color: [{ value: colorId, label: 'Red' }],
        sexo: [{ value: hombreId, label: 'Hombre' }],
        engine_size: [{ value: 2000 }],
        features: [{ value: featAId, label: 'Feature A' }],
        model_name: [{ value: 'sedan' }],
        parent: [
          {
            value: 'owner_shared_1',
            label: 'Alice',
            inheritedType: 'multiselect',
            inheritedValue: [{ value: langEnId, label: 'English' }],
          },
        ],
        owner: [
          {
            value: 'owner_shared_1',
            label: 'Alice',
            inheritedType: 'select',
            inheritedValue: [{ value: countryId, label: 'Argentina' }],
          },
        ],
        garage: [{ value: 'owner_shared_1', label: 'Alice' }],
        registered_on: [{ value: 1592179200 }],
      },
    },
    {
      _id: factory.id('entity2'),
      sharedId: 'shared2',
      language: 'en',
      template: templateId,
      title: 'Car 2',
      published: true,
      metadata: {
        color: [{ value: colorId, label: 'Red' }],
        sexo: [{ value: mujerId, label: 'Mujer' }],
        engine_size: [{ value: 3000 }],
        features: [
          { value: featAId, label: 'Feature A' },
          { value: featBId, label: 'Feature B' },
        ],
        model_name: [{ value: 'suv' }],
        parent: [
          {
            value: 'owner_shared_2',
            label: 'Bob',
            inheritedType: 'multiselect',
            inheritedValue: [
              { value: langEnId, label: 'English' },
              { value: langEsId, label: 'Spanish' },
            ],
          },
        ],
        owner: [
          {
            value: 'owner_shared_2',
            label: 'Bob',
            inheritedType: 'select',
            inheritedValue: [{ value: countryId, label: 'Argentina' }],
          },
        ],
        garage: [{ value: 'owner_shared_2', label: 'Bob' }],
        registered_on: [{ value: 1623715200 }],
      },
    },
    ...Array.from({ length: 9 }, (_, index) => ({
      _id: factory.id(`entity-hombre-${index}`),
      sharedId: `shared-hombre-${index}`,
      language: 'en',
      template: templateId,
      title: `Car H ${index}`,
      published: true,
      metadata: {
        color: [{ value: colorId, label: 'Red' }],
        sexo: [{ value: hombreId, label: 'Hombre' }],
        engine_size: [{ value: 2500 }],
        features: [{ value: featBId, label: 'Feature B' }],
        model_name: [{ value: 'sedan' }],
        garage: [{ value: `owner_shared_h_${index}`, label: `Owner ${index}` }],
        ...(index < 2 ? { registered_on: [{ value: 1592179200 }] } : {}),
      },
    })),
    {
      _id: factory.id('entity-no-sexo'),
      sharedId: 'shared-no-sexo',
      language: 'en',
      template: templateId,
      title: 'Car without sexo',
      published: true,
      metadata: {
        color: [{ value: colorId, label: 'Red' }],
        engine_size: [{ value: 4000 }],
        features: [],
        model_name: [{ value: 'coupe' }],
      },
    },
    {
      _id: factory.id('unpublished-car'),
      sharedId: 'shared-unpublished',
      language: 'en',
      template: templateId,
      title: 'Unpublished car',
      published: false,
      metadata: {
        color: [{ value: unpublishedColorId, label: 'Blue' }],
      },
    },
  ],
};

describe('DatavizQueryExecutor', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresEntities: usePostgres, postgresFiles: usePostgres },
      });
      // The default fixtures have no entities, so testingPG.setFixtures does not
      // clear the entities table — without this, PG rows leak across tests.
      await testingPG.clear(['entities']);
      await testingEnvironment.setFixtures(fixtures);
    });

    const createExecutor = (
      actor: User = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' })
    ) =>
      testingEnvironment.runWithContext(() => {
        const tm = ExecutionContext.transactionManager as MongoTransactionManager;
        const deps = {
          settingsDS: SettingsDataSourceFactory.cached({ transactionManager: tm }),
          translationsDS: TranslationsDataSourceFactory.cached({ transactionManager: tm }),
          templatesDAO: TemplatesDAOFactory.default() as TemplatesReadDAO,
          thesauriDAO: ThesauriDAOFactory.default(),
          entitiesDAO: EntitiesDAOFactory.default() as EntitiesReadDAO,
        };
        const accessContext = AccessContext.forActor(actor);
        const strategy = usePostgres
          ? new PostgresDatavizQueryExecutor({
              tenantId: ExecutionContext.tenant.name,
              pgTransactionManager: ExecutionContext.postgresTransactionManager,
              accessContext,
            })
          : new MongoDatavizQueryExecutor(getConnection(), tm, accessContext);
        return new DatavizQueryOrchestrator(deps, strategy);
      });

    it('should aggregate entities by select dimension', async () => {
      const executor = createExecutor();

      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test' }
      );

      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: colorId, label: 'Red', value: 12 })])
      );
      expect(dto.meta.totalEntities).toBe(12);
    });

    it('should aggregate by related entity label on a relationship property', async () => {
      const executor = createExecutor();

      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            {
              property: 'garage',
              propertyType: 'select',
              relationshipMode: 'related_entity',
            },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-rel-label' }
      );

      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'owner_shared_1', label: 'Alice', value: 1 }),
          expect.objectContaining({ key: 'owner_shared_2', label: 'Bob', value: 1 }),
        ])
      );
      expect(dto.meta.totalEntities).toBe(12);
    });

    it('should include a no data bucket for entities without a dimension value', async () => {
      const executor = createExecutor();

      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            {
              property: 'sexo',
              propertyType: 'select',
            },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-include-missing' }
      );

      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'No data', value: 1 }),
          expect.objectContaining({ label: 'Hombre', value: 10 }),
          expect.objectContaining({ label: 'Mujer', value: 1 }),
        ])
      );
      expect(dto.meta.totalEntities).toBe(12);
    });

    it('should aggregate by inherited select on a relationship property', async () => {
      const executor = createExecutor();

      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            {
              property: 'owner',
              propertyType: 'select',
              relationshipMode: 'inherited',
            },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-rel-inherited' }
      );

      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: countryId, label: 'Argentina', value: 2 }),
        ])
      );
    });

    it('should keep all primary buckets when a secondary relationship dimension is added', async () => {
      const executor = createExecutor();

      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            {
              property: 'sexo',
              propertyType: 'select',
              maxBuckets: 10,
              sort: 'count_desc',
            },
            {
              property: 'garage',
              propertyType: 'select',
              relationshipMode: 'related_entity',
              maxBuckets: 10,
              sort: 'count_desc',
            },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-two-dims' }
      );

      const mujer = dto.series[0]?.points.find(p => p.label === 'Mujer');
      const hombre = dto.series[0]?.points.find(p => p.label === 'Hombre');

      expect(mujer).toEqual(expect.objectContaining({ label: 'Mujer', value: 1 }));
      expect(hombre?.value).toBe(10);
      expect(dto.meta.totalEntities).toBe(12);
      expect(dto.meta.truncated).toBe(false);
    });

    it('should bucket date dimensions by year by default', async () => {
      const executor = createExecutor();
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            { property: 'registered_on', propertyType: 'date', bucketStrategy: 'date_histogram' },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-date-year' }
      );

      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 2020, label: '2020', value: 3 }),
          expect.objectContaining({ key: 2021, label: '2021', value: 1 }),
        ])
      );
    });

    it('should return total entity count for metric queries without dimensions', async () => {
      const executor = createExecutor();
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [],
          measures: [{ aggregation: 'count', countMode: 'all' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-metric-count' }
      );

      expect(dto.series).toHaveLength(1);
      expect(dto.series[0]?.points).toEqual([
        expect.objectContaining({ key: 'total', label: 'Total', value: 12 }),
      ]);
      expect(dto.meta.totalEntities).toBe(12);
    });

    it('should union two templates with date and select dimensions into one breakdown series', async () => {
      const executor = createExecutor();
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [
            { templateId: ownersTemplateId.toString(), alias: 'owners' },
            { templateId: personasTemplateId.toString(), alias: 'personas' },
          ],
          join: { type: 'union' },
          dimensions: [
            {
              property: 'date_of_birth',
              propertyType: 'date',
              bucketStrategy: 'date_histogram',
              dateInterval: 'year',
              sort: 'key_asc',
              maxBuckets: 10,
            },
            {
              property: 'sex',
              propertyType: 'select',
              bucketStrategy: 'terms',
              sort: 'count_desc',
              maxBuckets: 10,
            },
          ],
          measures: [{ aggregation: 'count', countMode: 'all' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-union-date-select' }
      );

      expect(dto.series).toHaveLength(1);
      expect(dto.series[0]?.label).toBe('Union');

      const year2000 = dto.series[0]?.points.find(point => point.key === 2000);
      const year2005 = dto.series[0]?.points.find(point => point.key === 2005);

      expect(year2000?.value).toBe(3);
      expect(year2000?.breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: hombreId, label: 'Hombre', value: 2 }),
          expect.objectContaining({ key: mujerId, label: 'Mujer', value: 1 }),
        ])
      );
      expect(year2005?.value).toBe(1);
      expect(year2005?.breakdown).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: mujerId, label: 'Mujer', value: 1 })])
      );
      expect(dto.series[0]?.points).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: 'No data', value: 1 })])
      );
      expect(dto.meta.totalEntities).toBe(5);
    });

    it('should compare two templates with date and select dimensions as aligned breakdown series', async () => {
      const executor = createExecutor();
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const dto = await executor.execute(
        {
          sources: [
            { templateId: ownersTemplateId.toString(), alias: 'owners' },
            { templateId: personasTemplateId.toString(), alias: 'personas' },
          ],
          join: { type: 'compare' },
          dimensions: [
            {
              property: 'date_of_birth',
              propertyType: 'date',
              bucketStrategy: 'date_histogram',
              dateInterval: 'year',
              sort: 'key_asc',
              maxBuckets: 10,
            },
            {
              property: 'sex',
              propertyType: 'select',
              bucketStrategy: 'terms',
              sort: 'count_desc',
              maxBuckets: 10,
            },
          ],
          measures: [{ aggregation: 'count', countMode: 'all' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-compare-date-select' }
      );

      expect(dto.series).toHaveLength(2);
      expect(dto.series.map(series => series.label)).toEqual(
        expect.arrayContaining(['Owners', 'Personas'])
      );

      const ownersYear2000 = dto.series
        .find(series => series.label === 'Owners')
        ?.points.find(point => point.key === 2000);
      const personasYear2005 = dto.series
        .find(series => series.label === 'Personas')
        ?.points.find(point => point.key === 2005);

      expect(ownersYear2000?.breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: hombreId, label: 'Hombre', value: 1 }),
          expect.objectContaining({ key: mujerId, label: 'Mujer', value: 1 }),
        ])
      );
      expect(personasYear2005?.breakdown).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: mujerId, label: 'Mujer', value: 1 })])
      );
    });

    describe('filters', () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const run = async (query: DatavizQuery, context: Partial<DatavizQueryContext> = {}) =>
        createExecutor(admin).execute(query, { actor: admin, datavizId: 'test', ...context });

      it('should apply an equality filter on a select property', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            { id: 'f1', property: 'sexo', propertyType: 'select', operator: 'eq', value: hombreId },
          ],
        });

        expect(dto.meta.totalEntities).toBe(10);
        expect(dto.series[0]?.points).toEqual([
          expect.objectContaining({ key: hombreId, label: 'Hombre', value: 10 }),
        ]);
      });

      it('should apply a negation filter on a select property', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            { id: 'f1', property: 'sexo', propertyType: 'select', operator: 'ne', value: mujerId },
          ],
        });

        expect(dto.meta.totalEntities).toBe(11);
        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: hombreId, label: 'Hombre', value: 10 }),
            expect.objectContaining({ label: 'No data', value: 1 }),
          ])
        );
      });

      it('should apply in/nin filters on a select property', async () => {
        const inDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'sexo',
              propertyType: 'select',
              operator: 'in',
              values: [hombreId, mujerId],
            },
          ],
        });
        // The entity without sexo has no value to match, so it is excluded.
        expect(inDto.meta.totalEntities).toBe(11);

        const ninDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            { id: 'f1', property: 'sexo', propertyType: 'select', operator: 'nin', values: [mujerId] },
          ],
        });
        expect(ninDto.meta.totalEntities).toBe(11);
      });

      it('should apply numeric between/gte/lte filters', async () => {
        const betweenDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'between',
              from: 2000,
              to: 3000,
            },
          ],
        });
        expect(betweenDto.meta.totalEntities).toBe(11);

        const gteDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'gte',
              value: 3000,
            },
          ],
        });
        expect(gteDto.meta.totalEntities).toBe(2);

        const lteDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'lte',
              value: 2500,
            },
          ],
        });
        expect(lteDto.meta.totalEntities).toBe(10);
      });

      it('should apply an equality filter on a numeric property with a string value', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'eq',
              // string form of 2500: numerically equal to the stored JSON number 2500
              value: '2500.0',
            },
          ],
        });

        expect(dto.meta.totalEntities).toBe(9);
      });

      it('should apply a negation filter on a numeric property with a string value', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'ne',
              // string form of 2500: numerically equal to the stored JSON number 2500
              value: '2500.0',
            },
          ],
        });

        expect(dto.meta.totalEntities).toBe(3);
      });

      it('should apply in/nin filters on a numeric property', async () => {
        const inDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'in',
              values: [2000, 4000],
            },
          ],
        });
        expect(inDto.meta.totalEntities).toBe(2);

        const ninDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'nin',
              values: [2500],
            },
          ],
        });
        expect(ninDto.meta.totalEntities).toBe(3);
      });

      it('should apply numeric between filters with string bounds', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'between',
              // string forms of 2000/3000: numerically equal to the stored JSON numbers
              from: '2000.0',
              to: '3000.0',
            },
          ],
        });

        expect(dto.meta.totalEntities).toBe(11);
      });

      it('should apply numeric gte/lte filters with string bounds', async () => {
        const gteDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'gte',
              // string form of 3000
              value: '3000.0',
            },
          ],
        });
        expect(gteDto.meta.totalEntities).toBe(2);

        const lteDto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'engine_size',
              propertyType: 'numeric',
              operator: 'lte',
              // string form of 2500
              value: '2500.0',
            },
          ],
        });
        expect(lteDto.meta.totalEntities).toBe(10);
      });

      it('should apply a contains filter on a text property', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              property: 'model_name',
              propertyType: 'text',
              operator: 'contains',
              value: 'sedan',
            },
          ],
        });

        expect(dto.meta.totalEntities).toBe(10);
      });

      it('should apply a filter only to its source alias', async () => {
        const dto = await run({
          sources: [
            { templateId: ownersTemplateId.toString(), alias: 'owners' },
            { templateId: personasTemplateId.toString(), alias: 'personas' },
          ],
          join: { type: 'union' },
          dimensions: [{ property: 'date_of_birth', propertyType: 'date', dateInterval: 'year' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
          filters: [
            {
              id: 'f1',
              sourceAlias: 'owners',
              property: 'sex',
              propertyType: 'select',
              operator: 'eq',
              value: hombreId,
            },
          ],
        });

        const year2000 = dto.series[0]?.points.find(point => point.key === 2000);
        const year2005 = dto.series[0]?.points.find(point => point.key === 2005);

        expect(dto.meta.totalEntities).toBe(3);
        expect(year2000?.value).toBe(2);
        expect(year2005?.value).toBe(1);
      });

      it('should apply an external date range filter', async () => {
        const dto = await run(
          {
            sources: [{ templateId: templateId.toString() }],
            dimensions: [{ property: 'registered_on', propertyType: 'date' }],
            measures: [{ aggregation: 'count' }],
            language: 'en',
          },
          {
            externalFilters: [
              {
                id: 'x1',
                scope: 'external',
                property: 'registered_on',
                propertyType: 'date',
                operator: 'between',
                from: 1600000000,
                to: 1630000000,
              },
            ],
          }
        );

        expect(dto.meta.totalEntities).toBe(1);
        expect(dto.series[0]?.points).toEqual([
          expect.objectContaining({ key: 2021, label: '2021', value: 1 }),
        ]);
      });

      it('should apply an external date-range filter on a daterange property by overlap', async () => {
        const overlapping = await run(
          {
            sources: [{ templateId: ownersTemplateId.toString() }],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
            language: 'en',
          },
          {
            externalFilters: [
              {
                id: 'x1',
                scope: 'external',
                property: 'period',
                propertyType: 'daterange',
                operator: 'between',
                from: 1577836800,
                to: 1609459199,
              },
            ],
          }
        );
        expect(overlapping.meta.totalEntities).toBe(2);

        const noOverlap = await run(
          {
            sources: [{ templateId: ownersTemplateId.toString() }],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
            language: 'en',
          },
          {
            externalFilters: [
              {
                id: 'x1',
                scope: 'external',
                property: 'period',
                propertyType: 'daterange',
                operator: 'between',
                from: 1514764800,
                to: 1546300799,
              },
            ],
          }
        );
        expect(noOverlap.meta.totalEntities).toBe(0);
      });
    });

    describe('dimension types', () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const run = async (query: DatavizQuery) =>
        createExecutor(admin).execute(query, { actor: admin, datavizId: 'test' });

      it('should aggregate by a multiselect dimension', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'features', propertyType: 'multiselect' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: featAId, label: 'Feature A', value: 2 }),
            expect.objectContaining({ key: featBId, label: 'Feature B', value: 10 }),
            expect.objectContaining({ label: 'No data', value: 1 }),
          ])
        );
      });

      it('should aggregate by an inherited multiselect on a relationship property', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [
            {
              property: 'parent',
              propertyType: 'multiselect',
              relationshipMode: 'inherited',
            },
          ],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: langEnId, label: 'English', value: 2 }),
            expect.objectContaining({ key: langEsId, label: 'Spanish', value: 1 }),
            expect.objectContaining({ label: 'No data', value: 10 }),
          ])
        );
      });

      it('should aggregate by a numeric dimension with numeric bucket keys', async () => {
        const dto = await run({
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'engine_size', propertyType: 'numeric', sort: 'key_asc' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series[0]?.points.map(point => point.key)).toEqual([2000, 2500, 3000, 4000]);
        expect(dto.series[0]?.points.map(point => point.value)).toEqual([1, 9, 1, 1]);
      });

      it('should aggregate by the template dimension', async () => {
        const dto = await run({
          sources: [
            { templateId: templateId.toString() },
            { templateId: ownersTemplateId.toString() },
          ],
          join: { type: 'union' },
          dimensions: [{ property: '__template__', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series[0]?.label).toBe('Union');
        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: templateId.toString(), label: 'Cars', value: 12 }),
            expect.objectContaining({ key: ownersTemplateId.toString(), label: 'Owners', value: 3 }),
          ])
        );
      });
    });

    describe('date intervals', () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const run = async (dateInterval: DatavizQuery['dimensions'][number]['dateInterval']) => {
        const executor = createExecutor(admin);
        return executor.execute(
          {
            sources: [{ templateId: templateId.toString() }],
            dimensions: [{ property: 'registered_on', propertyType: 'date', dateInterval }],
            measures: [{ aggregation: 'count' }],
            language: 'en',
          },
          { actor: admin, datavizId: 'test' }
        );
      };

      it('should bucket dates by month', async () => {
        const dto = await run('month');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: '2020-06', label: '2020-06', value: 3 }),
            expect.objectContaining({ key: '2021-06', label: '2021-06', value: 1 }),
          ])
        );
      });

      it('should bucket dates by ISO week', async () => {
        const dto = await run('week');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: '2020-W25', label: '2020-W25', value: 3 }),
            expect.objectContaining({ key: '2021-W24', label: '2021-W24', value: 1 }),
          ])
        );
      });

      it('should bucket dates by computed years', async () => {
        const dto = await run('computed_years');

        const points = dto.series[0]?.points ?? [];
        const numericKeys = points
          .filter(point => typeof point.key === 'number')
          .map(point => point.key as number)
          .sort((a, b) => a - b);
        // Bucket keys drift with the current date; only their relative offset is stable.
        expect(numericKeys).toHaveLength(2);
        expect(numericKeys[1] - numericKeys[0]).toBe(1);
        expect(points.find(point => point.label === 'No data')?.value).toBe(8);
        expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(12);
      });
    });

    describe('measures', () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const run = async (aggregation: 'sum' | 'avg' | 'min' | 'max') => {
        const executor = createExecutor(admin);
        return executor.execute(
          {
            sources: [{ templateId: templateId.toString() }],
            dimensions: [{ property: 'sexo', propertyType: 'select' }],
            measures: [{ aggregation, property: 'engine_size', propertyType: 'numeric' }],
            language: 'en',
          },
          { actor: admin, datavizId: 'test' }
        );
      };

      it('should aggregate the sum measure per bucket', async () => {
        const dto = await run('sum');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: hombreId, label: 'Hombre', value: 24500 }),
            expect.objectContaining({ key: mujerId, label: 'Mujer', value: 3000 }),
            expect.objectContaining({ label: 'No data', value: 4000 }),
          ])
        );
      });

      it('should aggregate the avg measure per bucket', async () => {
        const dto = await run('avg');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: hombreId, label: 'Hombre', value: 2450 }),
            expect.objectContaining({ key: mujerId, label: 'Mujer', value: 3000 }),
            expect.objectContaining({ label: 'No data', value: 4000 }),
          ])
        );
      });

      it('should aggregate the min measure per bucket', async () => {
        const dto = await run('min');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: hombreId, label: 'Hombre', value: 2000 }),
            expect.objectContaining({ key: mujerId, label: 'Mujer', value: 3000 }),
            expect.objectContaining({ label: 'No data', value: 4000 }),
          ])
        );
      });

      it('should aggregate the max measure per bucket', async () => {
        const dto = await run('max');

        expect(dto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: hombreId, label: 'Hombre', value: 2500 }),
            expect.objectContaining({ key: mujerId, label: 'Mujer', value: 3000 }),
            expect.objectContaining({ label: 'No data', value: 4000 }),
          ])
        );
      });
    });

    it('should mark the result as truncated when the bucket limit is reached', async () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });
      const dto = await createExecutor(admin).execute(
        {
          sources: [{ templateId: templateId.toString() }],
          dimensions: [{ property: 'sexo', propertyType: 'select', maxBuckets: 1 }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        },
        { actor: admin, datavizId: 'test-truncation' }
      );

      expect(dto.meta.truncated).toBe(true);
      expect(dto.series[0]?.points).toHaveLength(1);
      expect(dto.series[0]?.points[0]).toEqual(
        expect.objectContaining({ key: hombreId, label: 'Hombre', value: 10 })
      );
    });

    describe('multi-source', () => {
      const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

      const run = async (query: DatavizQuery) =>
        createExecutor(admin).execute(query, { actor: admin, datavizId: 'test' });

      it('should union three sources into one series', async () => {
        const dto = await run({
          sources: [
            { templateId: templateId.toString(), alias: 'a' },
            { templateId: templateId.toString(), alias: 'b' },
            { templateId: templateId.toString(), alias: 'c' },
          ],
          join: { type: 'union' },
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series).toHaveLength(1);
        expect(dto.series[0]?.label).toBe('Union');
        expect(dto.series[0]?.points).toEqual([
          expect.objectContaining({ key: colorId, label: 'Red', value: 36 }),
        ]);
        expect(dto.meta.totalEntities).toBe(36);
      });

      it('should compare three sources as three series', async () => {
        const dto = await run({
          sources: [
            { templateId: templateId.toString(), alias: 'a' },
            { templateId: templateId.toString(), alias: 'b' },
            { templateId: templateId.toString(), alias: 'c' },
          ],
          join: { type: 'compare' },
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
          language: 'en',
        });

        expect(dto.series).toHaveLength(3);
        dto.series.forEach(series => {
          expect(series.points).toEqual([
            expect.objectContaining({ key: colorId, label: 'Red', value: 12 }),
          ]);
        });
      });
    });

    describe('unpublished entities', () => {
      const colorQuery = {
        sources: [{ templateId: templateId.toString() }],
        dimensions: [{ property: 'color' as const, propertyType: 'select' as const }],
        measures: [{ aggregation: 'count' as const }],
        language: 'en',
      };

      it('should exclude unpublished entities by default (no flag)', async () => {
        const executor = createExecutor(User.createFrom(null));

        const dto = await executor.execute(colorQuery, {
          actor: User.createFrom(null),
          datavizId: 'test-unpublished-default',
        });

        expect(dto.series[0]?.points).toEqual(
          expect.not.arrayContaining([expect.objectContaining({ key: unpublishedColorId })])
        );
      });

      it('should include unpublished entities with includeUnpublished for privileged actors only', async () => {
        const admin = User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' });

        const adminExecutor = createExecutor(admin);
        const adminDto = await adminExecutor.execute(
          { ...colorQuery, includeUnpublished: true },
          { actor: admin, datavizId: 'test-unpublished-opt-in-admin' }
        );

        expect(adminDto.series[0]?.points).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ key: unpublishedColorId, label: 'Blue', value: 1 }),
          ])
        );

        const anonymous = User.createFrom(null);
        const anonymousExecutor = createExecutor(anonymous);
        const anonymousDto = await anonymousExecutor.execute(
          { ...colorQuery, includeUnpublished: true },
          { actor: anonymous, datavizId: 'test-unpublished-opt-in-anon' }
        );

        expect(anonymousDto.series[0]?.points).toEqual(
          expect.not.arrayContaining([expect.objectContaining({ key: unpublishedColorId })])
        );
      });

      it('should exclude unpublished entities when includeUnpublished is false, regardless of actor', async () => {
        for (const actor of [
          User.createFrom(null),
          User.createFrom({ _id: factory.id('admin').toString(), role: 'admin' }),
        ]) {
          const executor = createExecutor(actor);
          // eslint-disable-next-line no-await-in-loop
          const dto = await executor.execute(
            { ...colorQuery, includeUnpublished: false },
            { actor, datavizId: 'test-unpublished-opt-out' }
          );

          expect(dto.series[0]?.points).toEqual(
            expect.not.arrayContaining([expect.objectContaining({ key: unpublishedColorId })])
          );
        }
      });
    });
  });
});

