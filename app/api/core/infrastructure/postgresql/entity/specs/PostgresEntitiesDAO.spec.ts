/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresEntitiesDAOFactory } from '../../../factories/PostgresEntitiesDAOFactory.js';
import type { PostgresEntitiesDAO } from '../PostgresEntitiesDAO.js';

const factory = getFixturesFactory({ convertIdToString: true, postgresDefaults: true });

const baseFixtures = {
  templates: [factory.template('t1', [factory.property('text_prop', 'text')])],
  files: [
    factory.document('doc1', {
      entity: 'entity1',
      status: 'ready',
      fullText: { 1: 'page one content' },
    }),
    factory.attachment('att1', { entity: 'entity1' }),
    factory.document('doc2', {
      entity: 'entity2',
      status: 'ready',
    }),
  ],
  entities: [
    factory.entity('entity1', 't1'),
    factory.entity('entity2', 't1'),
    factory.entity('e1', 't1', {}, { language: 'en', title: 'Entity One' }),
    factory.entity('e2', 't1', {}, { language: 'en', title: 'Entity Two', icon: { _id: null } }),
    factory.entity('e3', 't1', {}, { language: 'es', title: 'Entidad Tres' }),
    factory.entity('e_no_files', 't1', {}, { language: 'en' }),
    factory.entity('entity1', 't1', {}, { language: 'es', title: 'Entidad Uno' }),
  ],
};

const createSut = (): PostgresEntitiesDAO =>
  testingEnvironment.runWithContext(() => PostgresEntitiesDAOFactory.default());

describe('PostgresEntitiesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    testingTenants.changeCurrentTenant({
      featureFlags: { postgresFiles: true },
    });
    await testingEnvironment.setFixtures(baseFixtures);
  });

  describe('getIds()', () => {
    it('returns all _id values when no filters are provided', async () => {
      const sut = createSut();
      const ids = await sut.getIds();

      expect(ids).toHaveLength(7);
    });

    it('filters by sharedId', async () => {
      const sut = createSut();
      const ids = await sut.getIds({ sharedId: 'entity2' });

      expect(ids).toHaveLength(1);
      expect(ids[0]).toBe(factory.idString('entity2-en'));
    });

    it('filters by sharedIds', async () => {
      const sut = createSut();
      const ids = await sut.getIds({ sharedIds: ['entity1', 'e3'] });

      expect(ids).toHaveLength(3);
    });

    it('filters by language', async () => {
      const sut = createSut();
      const ids = await sut.getIds({ language: 'es' });

      expect(ids).toHaveLength(2);
    });

    it('filters by template', async () => {
      const sut = createSut();
      const ids = await sut.getIds({ template: factory.idString('t1') });

      expect(ids).toHaveLength(7);
    });

    it('combines multiple filters', async () => {
      const sut = createSut();
      const ids = await sut.getIds({
        language: 'en',
        template: factory.idString('t1'),
      });

      expect(ids).toHaveLength(5);
    });

    it('filters by _id', async () => {
      const sut = createSut();
      const ids = await sut.getIds({ _id: factory.idString('entity1-en') });

      expect(ids).toEqual([factory.idString('entity1-en')]);
    });

    it('filters by ids', async () => {
      const sut = createSut();
      const ids = await sut.getIds({
        ids: [factory.idString('entity1-en'), factory.idString('e2-en')],
      });

      expect(ids).toHaveLength(2);
      expect(ids).toEqual(
        expect.arrayContaining([factory.idString('entity1-en'), factory.idString('e2-en')])
      );
    });
  });

  describe('getByIdsWithDocuments()', () => {
    it('returns entities with documents and attachments', async () => {
      const sut = createSut();
      const ids = [factory.idString('entity1-en'), factory.idString('entity2-en')];
      const result = await sut.getByIdsWithDocuments(ids);

      expect(result).toHaveLength(2);

      const e1 = result.find(r => r.sharedId === 'entity1')!;
      expect(e1).toBeDefined();
      expect(e1.documents).toHaveLength(1);
      expect(e1.documents![0].filename).toBe('doc1');
      expect(e1.attachments).toHaveLength(1);
      expect(e1.attachments![0].filename).toBe('att1');

      const e2 = result.find(r => r.sharedId === 'entity2')!;
      expect(e2).toBeDefined();
      expect(e2.documents).toHaveLength(1);
      expect(e2.documents![0].filename).toBe('doc2');
      expect(e2.attachments).toHaveLength(0);
    });

    it('returns empty array for empty ids', async () => {
      const sut = createSut();
      const result = await sut.getByIdsWithDocuments([]);
      expect(result).toEqual([]);
    });

    it('returns empty array for non-existent ids', async () => {
      const sut = createSut();
      const result = await sut.getByIdsWithDocuments(['nonexistent']);
      expect(result).toEqual([]);
    });

    it('respects limit option', async () => {
      const sut = createSut();
      const ids = [factory.idString('entity1-en'), factory.idString('entity2-en')];
      const result = await sut.getByIdsWithDocuments(ids, { limit: 1 });

      expect(result).toHaveLength(1);
    });

    it('includes fullText when documentsFullText is true', async () => {
      const sut = createSut();
      const result = await sut.getByIdsWithDocuments([factory.idString('entity1-en')], {
        documentsFullText: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].documents![0].fullText).toEqual({ 1: 'page one content' });
    });

    it('excludes fullText by default', async () => {
      const sut = createSut();
      const result = await sut.getByIdsWithDocuments([factory.idString('entity1-en')]);

      expect(result).toHaveLength(1);
      expect(result[0].documents![0]).not.toHaveProperty('fullText');
    });

    it('handles entities with no files', async () => {
      const sut = createSut();
      const result = await sut.getByIdsWithDocuments([factory.idString('e_no_files-en')]);

      expect(result).toHaveLength(1);
      expect(result[0].documents).toEqual([]);
      expect(result[0].attachments).toEqual([]);
    });
  });

  describe('count()', () => {
    it('counts all entities when no filters', async () => {
      const sut = createSut();
      const count = await sut.count();
      expect(count).toBe(7);
    });

    it('counts with filters', async () => {
      const sut = createSut();
      const count = await sut.count({ language: 'en' });
      expect(count).toBe(5);
    });

    it('returns 0 when no entities match', async () => {
      const sut = createSut();
      const count = await sut.count({ language: 'zz' });
      expect(count).toBe(0);
    });
  });

  describe('getSharedIdLabelInfo()', () => {
    it('returns title and icon for given sharedIds and language', async () => {
      const sut = createSut();
      const result = await sut.getSharedIdLabelInfo(['e1', 'e2'], 'en');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: 'e1', title: 'Entity One' }),
          expect.objectContaining({ sharedId: 'e2', title: 'Entity Two' }),
        ])
      );
    });

    it('returns empty array for empty sharedIds', async () => {
      const sut = createSut();
      const result = await sut.getSharedIdLabelInfo([], 'en');
      expect(result).toEqual([]);
    });

    it('only returns entities matching the language', async () => {
      const sut = createSut();
      const result = await sut.getSharedIdLabelInfo(['entity1'], 'es');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Entidad Uno');
    });
  });
});
