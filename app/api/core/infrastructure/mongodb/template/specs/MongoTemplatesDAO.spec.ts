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
    ]),
    factory.template('template2', [factory.property('numeric_prop', 'numeric')]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoTemplatesDAO', () => {
  describe('getAllProperties()', () => {
    it('returns all properties from all templates as a flat list', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dao = new MongoTemplatesDAO(getConnection(), transactionManager);

      const result = await dao.getAllProperties();

      expect(result).toContainEqual({ name: 'text_prop', type: 'text' });
      expect(result).toContainEqual({ name: 'date_prop', type: 'date' });
      expect(result).toContainEqual({ name: 'numeric_prop', type: 'numeric' });
    });

    it('excludes commonProperties', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dao = new MongoTemplatesDAO(getConnection(), transactionManager);

      const result = await dao.getAllProperties();

      const names = result.map(p => p.name);
      expect(names).not.toContain('title');
      expect(names).not.toContain('creationDate');
      expect(names).not.toContain('editDate');
    });

    it('returns an empty array when no templates exist', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const transactionManager = TransactionManagerFactory.default();
      const dao = new MongoTemplatesDAO(getConnection(), transactionManager);

      const result = await dao.getAllProperties();

      expect(result).toEqual([]);
    });

    it('returns an empty array when templates have no properties', async () => {
      await testingEnvironment.setUp({ templates: [factory.template('empty_template', [])] });
      const transactionManager = TransactionManagerFactory.default();
      const dao = new MongoTemplatesDAO(getConnection(), transactionManager);

      const result = await dao.getAllProperties();

      expect(result).toEqual([]);
    });

    it('reads through the active transaction session', async () => {
      await testingEnvironment.setUp({ templates: [] });
      const transactionManager = TransactionManagerFactory.default();
      const dao = new MongoTemplatesDAO(getConnection(), transactionManager);

      await transactionManager.run(async () => {
        const session = transactionManager.getSession()!;
        await getConnection()
          .collection('templates')
          .insertOne(factory.template('tx_template', [factory.property('tx_prop', 'text')]), {
            session,
          });

        const result = await dao.getAllProperties();
        expect(result).toContainEqual({ name: 'tx_prop', type: 'text' });
      });
    });
  });
});
