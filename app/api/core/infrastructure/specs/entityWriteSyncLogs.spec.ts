/* eslint-disable max-statements */
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { EntityAccessPolicyDataSourceFactory } from '#api/core/infrastructure/factories/EntityAccessPolicyDataSourceFactory.js';
import { search } from '#api/search/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  entity1Files,
  entityFor,
  entityWriteFixtures,
  expectEntity1FilesRefreshed,
  expectEntityLogsRefreshed,
  expectHeld,
  expectNoFileRefresh,
  expectRefreshed,
  findLog,
  idOf,
  logRows,
  ORIGINAL,
} from './entityWriteSyncLogsFixtures.js';

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('entity write sync logs', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
      await testingEnvironment.setFixtures(entityWriteFixtures());
    });

    const entities = () =>
      testingEnvironment.runWithContext(() => EntitiesDataSourceFactory.default());

    const policies = () =>
      testingEnvironment.runWithContext(() => EntityAccessPolicyDataSourceFactory.default());

    const dao = () => testingEnvironment.runWithContext(() => EntitiesDAOFactory.default());

    it('refreshes file logs when an entity is touched', async () => {
      await entities().touchEntitiesBySharedIds(['entity1']);

      const rows = await logRows();
      expectEntity1FilesRefreshed(rows);
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('refreshes file logs when an entity is inserted', async () => {
      const { entity } = entityFor('fresh', ['en']);
      await entities().bulkInsert([entity]);

      const rows = await logRows();
      expectRefreshed(findLog(rows, 'files', 'fresh-doc'));
      expectRefreshed(findLog(rows, 'entities', 'fresh-en'));
      expectHeld(findLog(rows, 'files', 'doc1'));
    });

    it('does not refresh file logs when an entity is deleted', async () => {
      const bulkDelete = jest.spyOn(search, 'bulkDeleteBySharedId').mockResolvedValue(undefined);

      await entities().bulkDelete(['entity1']);
      bulkDelete.mockRestore();

      const rows = await logRows();
      expectNoFileRefresh(rows);
      ['entity1-en', 'entity1-es'].forEach(key => {
        const row = findLog(rows, 'entities', key);
        expect(row?.deleted).toBe(true);
        expect(row?.timestamp).toBeGreaterThan(ORIGINAL);
      });
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs entity rows and refreshes file logs when metadata properties are deleted', async () => {
      await entities().deleteMetadataProperties(['text'], ['entity1']);

      const rows = await logRows();
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectEntity1FilesRefreshed(rows);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs entity rows and refreshes file logs when metadata properties are renamed', async () => {
      await entities().renameMetadataProperties({ text: 'body' }, ['entity1']);

      const rows = await logRows();
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectEntity1FilesRefreshed(rows);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs entity rows and refreshes file logs when references are removed', async () => {
      await entities().deleteReferencesToSharedIds(['gone']);

      const rows = await logRows();
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectEntity1FilesRefreshed(rows);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs entity rows and refreshes file logs on the deprecated metadata bulk update', async () => {
      const { entity, textProperty } = entityFor('entity1', ['en', 'es']);
      await entities().bulkUpdateDeprecated([entity], [textProperty]);

      const rows = await logRows();
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectEntity1FilesRefreshed(rows);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs every language row and refreshes file logs when permissions change', async () => {
      await policies().update(
        new EntityAccessPolicy({
          sharedId: 'entity1',
          grants: [{ refId: 'new-user', type: GrantType.Group, level: AccessLevel.Read }],
          isPublic: false,
        })
      );

      const rows = await logRows();
      expectEntityLogsRefreshed(rows, ['entity1-en', 'entity1-es']);
      expectEntity1FilesRefreshed(rows);
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('logs a new language row and refreshes file logs when a language is cloned', async () => {
      await dao().cloneForLanguage('en', 'fr');

      const stored = await testingEnvironment.db.getAllFrom('entities');
      const clonedIds = stored
        .filter(doc => doc.language === 'fr')
        .map(doc => idOf(doc._id as { toString(): string } | string));
      const rows = await logRows();

      expect(clonedIds).toHaveLength(2);
      clonedIds.forEach(mongoId => {
        const row = rows.find(log => log.namespace === 'entities' && log.mongoId === mongoId);
        expectRefreshed(row);
      });
      entity1Files.forEach(id => expectRefreshed(findLog(rows, 'files', id)));
      expectRefreshed(findLog(rows, 'files', 'doc2'));
      expectHeld(findLog(rows, 'files', 'custom1'));
      expectHeld(findLog(rows, 'files', 'fresh-doc'));
      expectHeld(findLog(rows, 'entities', 'entity1-en'));
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });

    it('marks language rows deleted and does not refresh file logs when a language is removed', async () => {
      await dao().deleteByLanguage('es');

      const rows = await logRows();
      const removed = findLog(rows, 'entities', 'entity1-es');
      expect(removed?.deleted).toBe(true);
      expect(removed?.timestamp).toBeGreaterThan(ORIGINAL);
      expectNoFileRefresh(rows);
      expectHeld(findLog(rows, 'entities', 'entity1-en'));
      expectHeld(findLog(rows, 'entities', 'entity2-en'));
    });
  });
});
