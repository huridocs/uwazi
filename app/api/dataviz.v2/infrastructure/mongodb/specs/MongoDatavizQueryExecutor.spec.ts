import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { User } from '#api/users.v2/model/User.js';
import { CachedTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { MongoDatavizQueryExecutor } from '../MongoDatavizQueryExecutor.js';

const createExecutor = () =>
  testingEnvironment.runWithContext(() => {
    const tm = ExecutionContext.transactionManager as MongoTransactionManager;
    return new MongoDatavizQueryExecutor(getConnection(), tm, {
      settingsDS: SettingsDataSourceFactory.cached({ transactionManager: tm }),
      translationsDS: CachedTranslationsDataSource(tm),
      templatesDAO: TemplatesDAOFactory.default(),
      thesauriDAO: ThesauriDAOFactory.default(),
    });
  });

const factory = getFixturesFactory();

const templateId = factory.id('carsTemplate');
const ownersTemplateId = factory.id('ownersTemplate');
const colorId = 'ba0df33d-ab09-46be-9080-00575d0804d0';
const countryId = 'c0ffee00-0000-4000-8000-000000000001';
const hombreId = 'a1000000-0000-4000-8000-000000000001';
const mujerId = 'a2000000-0000-4000-8000-000000000002';
const thesaurusId = factory.id('colorsThesaurus');
const countriesThesaurusId = factory.id('countriesThesaurus');
const sexThesaurusId = factory.id('sexThesaurus');

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
        factory.relationshipProp('garage', 'ownersTemplate'),
        factory.property('sexo', 'select', { content: sexThesaurusId.toString() }),
        factory.property('registered_on', 'date'),
      ],
      commonProperties: factory.commonProperties(),
    },
  ],
  dictionaries: [
    {
      _id: thesaurusId,
      name: 'Colors',
      values: [{ id: colorId, label: 'Red' }],
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
  ],
  entities: [
    {
      _id: factory.id('owner1'),
      sharedId: 'owner_shared_1',
      language: 'en',
      template: ownersTemplateId,
      title: 'Alice',
      published: true,
      metadata: { country: [{ value: countryId, label: 'Argentina' }] },
    },
    {
      _id: factory.id('owner2'),
      sharedId: 'owner_shared_2',
      language: 'en',
      template: ownersTemplateId,
      title: 'Bob',
      published: true,
      metadata: { country: [{ value: countryId, label: 'Argentina' }] },
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
      },
    },
  ],
};

describe('MongoDatavizQueryExecutor', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
      expect.arrayContaining([
        expect.objectContaining({ key: colorId, label: 'Red', value: 12 }),
      ])
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
        dimensions: [{ property: 'registered_on', propertyType: 'date', bucketStrategy: 'date_histogram' }],
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
});
