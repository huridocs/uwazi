import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTemplatesDAO } from '../MongoTemplatesDAO.js';

const factory = getFixturesFactory();

const fixtures = {
  templates: [
    factory.template('template1', [
      factory.property('text_prop', 'text'),
      factory.property('date_prop', 'date'),
      factory.property('relationship_to_text', 'relationship', { inherit: { type: 'text' } }),
    ]),
    factory.template('template2', [factory.property('numeric_prop', 'numeric')]),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const sut = new MongoTemplatesDAO({ db: getConnection(), transactionManager });

  return { sut, transactionManager };
};

describe('MongoTemplatesDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getAllFilterableProperties()', () => {
    it('always includes title regardless of template content', async () => {
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      expect(result).toContainEqual({ name: 'title', type: 'text' });
    });

    it('returns only properties with filter: true from templates', async () => {
      await testingEnvironment.setUp({
        templates: [
          factory.template('template1', [
            factory.property('filterable_text', 'text', { filter: true }),
            factory.property('non_filterable_date', 'date', { filter: false }),
            factory.property('no_filter_flag', 'numeric'),
          ]),
        ],
      });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      const names = result.map(p => p.name);
      expect(names).toContain('filterable_text');
      expect(names).not.toContain('non_filterable_date');
      expect(names).not.toContain('no_filter_flag');
    });

    it('does not include properties with filter: false or filter absent', async () => {
      await testingEnvironment.setUp({
        templates: [
          factory.template('template1', [
            factory.property('no_filter', 'text'),
            factory.property('false_filter', 'date', { filter: false }),
          ]),
        ],
      });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      const names = result.map(p => p.name);
      expect(names).not.toContain('no_filter');
      expect(names).not.toContain('false_filter');
    });

    it('deduplicates the same property name shared across multiple templates', async () => {
      await testingEnvironment.setUp({
        templates: [
          factory.template('template1', [
            factory.property('shared_prop', 'text', { filter: true }),
          ]),
          factory.template('template2', [
            factory.property('shared_prop', 'text', { filter: true }),
          ]),
        ],
      });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      const matchingNames = result.filter(p => p.name === 'shared_prop');
      expect(matchingNames).toHaveLength(1);
    });

    it('returns only [title] when no templates exist', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      expect(result).toEqual([{ name: 'title', type: 'text' }]);
    });

    it('returns only [title] when no filterable properties exist', async () => {
      await testingEnvironment.setUp({
        templates: [factory.template('template1', [factory.property('non_filterable', 'text')])],
      });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      expect(result).toEqual([{ name: 'title', type: 'text' }]);
    });

    it('includes inheritedType for filterable relationship properties', async () => {
      await testingEnvironment.setUp({
        templates: [
          factory.template('template1', [
            factory.property('rel_prop', 'relationship', {
              filter: true,
              inherit: { type: 'text' },
            }),
          ]),
        ],
      });
      const { sut } = createSut();
      const result = await sut.getAllFilterableProperties();

      expect(result).toContainEqual({
        name: 'rel_prop',
        type: 'relationship',
        inheritedType: 'text',
      });
    });

    it('reads filterable properties through the active transaction session', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const { sut, transactionManager } = createSut();

      await transactionManager.run(async () => {
        const session = transactionManager.getSession()!;
        await getConnection()
          .collection('templates')
          .insertOne(
            factory.template('tx_template', [
              factory.property('tx_filterable', 'text', { filter: true }),
              factory.property('tx_non_filterable', 'date'),
            ]),
            { session }
          );

        const result = await sut.getAllFilterableProperties();
        const names = result.map(p => p.name);
        expect(names).toContain('tx_filterable');
        expect(names).not.toContain('tx_non_filterable');
      });
    });
  });

  describe('get()', () => {
    it('should return all templates when called without ids', async () => {
      const { sut } = createSut();
      const result = await sut.get();

      expect(result).toHaveLength(2);
      expect(result.map(t => t.name)).toContain('template1');
      expect(result.map(t => t.name)).toContain('template2');
    });

    it('should return templates matching the given ids', async () => {
      const { sut } = createSut();
      const all = await sut.get();
      const ids = all.map(t => t._id.toString());

      const result = await sut.get([ids[0]]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('template1');
    });

    it('should return multiple templates when given multiple ids', async () => {
      const { sut } = createSut();
      const all = await sut.get();
      const ids = all.map(t => t._id.toString());

      const result = await sut.get(ids);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no ids match', async () => {
      const { sut } = createSut();
      const result = await sut.get(['000000000000000000000000']);
      expect(result).toEqual([]);
    });

    it('should return empty array when ids array is empty', async () => {
      const { sut } = createSut();
      const result = await sut.get([]);
      expect(result).toEqual([]);
    });

    it('should read templates through the active transaction session', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const { sut, transactionManager } = createSut();

      await transactionManager.run(async () => {
        const session = transactionManager.getSession()!;
        await getConnection()
          .collection('templates')
          .insertOne(factory.template('tx_template', []), { session });

        const result = await sut.get();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('tx_template');
      });
    });
  });
});
