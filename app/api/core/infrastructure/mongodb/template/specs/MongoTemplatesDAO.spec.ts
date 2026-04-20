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

  describe('getAllProperties()', () => {
    it('returns all properties from all templates as a flat list', async () => {
      const { sut } = createSut();
      const result = await sut.getAllProperties();

      expect(result).toContainEqual({ name: 'text_prop', type: 'text' });
      expect(result).toContainEqual({ name: 'date_prop', type: 'date' });
      expect(result).toContainEqual({ name: 'numeric_prop', type: 'numeric' });
      expect(result).toContainEqual({
        name: 'relationship_to_text',
        type: 'relationship',
        inheritedType: 'text',
      });
    });

    it('excludes commonProperties', async () => {
      const { sut } = createSut();

      const result = await sut.getAllProperties();

      const names = result.map(p => p.name);
      expect(names).not.toContain('title');
      expect(names).not.toContain('creationDate');
      expect(names).not.toContain('editDate');
    });

    it('returns an empty array when no templates exist', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const { sut } = createSut();

      const result = await sut.getAllProperties();

      expect(result).toEqual([]);
    });

    it('returns an empty array when templates have no properties', async () => {
      await testingEnvironment.setUp({ templates: [factory.template('empty_template', [])] });
      const { sut } = createSut();

      const result = await sut.getAllProperties();

      expect(result).toEqual([]);
    });

    it('reads through the active transaction session', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const { sut, transactionManager } = createSut();

      await transactionManager.run(async () => {
        const session = transactionManager.getSession()!;
        await getConnection()
          .collection('templates')
          .insertOne(factory.template('tx_template', [factory.property('tx_prop', 'text')]), {
            session,
          });

        const result = await sut.getAllProperties();
        expect(result).toContainEqual({ name: 'tx_prop', type: 'text' });
      });
    });
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
});
