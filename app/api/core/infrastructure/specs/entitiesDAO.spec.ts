/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import { User } from '#api/users.v2/model/User.js';

const factory = getFixturesFactory();

const adminUser = new User(factory.id('admin_user').toString(), 'admin', []);
const editorUser = new User(factory.id('editor_user').toString(), 'editor', []);
const collaboratorUser = new User(factory.id('collab_user').toString(), 'collaborator', [
  factory.id('collab_group').toString(),
]);
const otherCollaborator = new User(factory.id('other_collab').toString(), 'collaborator', []);
const publicUser = User.createFrom(null);

const createFixtures = (): DBFixture => ({
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  templates: [
    factory.template('t1', [
      factory.property('text_prop', 'text'),
      factory.relationshipProp('rel_prop'),
    ]),
    factory.template('t2', []),
  ],

  files: [
    factory.document('doc1', {
      entity: 'entity1',
      status: 'ready',
      mimetype: 'application/pdf',
      fullText: { 1: 'page one content' },
    }),
    factory.attachment('att1', { entity: 'entity1', mimetype: 'application/pdf' }),
  ],

  entities: [
    // entity1: published, t1, en+es, with metadata and a user permission for collab_user
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity1',
      't1',
      {
        text_prop: [factory.metadataValue('value1')],
        rel_prop: [factory.metadataValue('target1')],
      },
      {
        published: true,
        permissions: [factory.entityPermission('collab_user', 'user', 'write')],
      }
    ),

    // entity2: unpublished, t1, en, with metadata
    factory.entity(
      'entity2',
      't1',
      { text_prop: [factory.metadataValue('value2')] },
      { published: false }
    ),

    // entity3: published, t2, en, no metadata
    factory.entity('entity3', 't2', {}, { published: true }),

    // entity4: published, t2, en+es
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity4', 't2', {}, { published: true }),

    // entity5: unpublished, t1, en, shared with collab_user via group permission
    factory.entity(
      'entity5',
      't1',
      {},
      {
        published: false,
        permissions: [factory.entityPermission('collab_group', 'group', 'read')],
      }
    ),

    // entity6: published, t1, es, empty title (for titleNotEmpty)
    factory.entity('entity6', 't1', {}, { published: true, language: 'es', title: '' }),
  ],
});

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('EntitiesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresEntities: usePostgres, postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(createFixtures());
    });

    const createDao = (user: User = editorUser): EntitiesDAO =>
      testingEnvironment.runWithContext(() => EntitiesDAOFactory.default({ user }));

    const allEntityCount = 8;
    const publishedEntityCount = 6;
    const distinctSharedIds = ['entity1', 'entity2', 'entity3', 'entity4', 'entity5', 'entity6'];

    describe('permission safety (safe by default)', () => {
      it('returns only published entities for anonymous users', async () => {
        const dao = createDao(publicUser);
        const entities = await dao.find();
        expect(entities).toHaveLength(publishedEntityCount);
      });

      it('returns published + explicitly shared entities for a collaborator', async () => {
        const dao = createDao(collaboratorUser);
        const entities = await dao.find();
        const sharedIds = entities.map(e => e.sharedId);
        expect(entities).toHaveLength(publishedEntityCount + 1);
        expect(sharedIds).toContain('entity5');
        expect(sharedIds).not.toContain('entity2');
      });

      it('returns only published entities for a collaborator without matching permissions', async () => {
        const dao = createDao(otherCollaborator);
        const entities = await dao.find();
        expect(entities).toHaveLength(publishedEntityCount);
      });

      it('returns all entities for editor and admin users', async () => {
        const editorEntities = await createDao(editorUser).find();
        const adminEntities = await createDao(adminUser).find();
        expect(editorEntities).toHaveLength(allEntityCount);
        expect(adminEntities).toHaveLength(allEntityCount);
      });

      it('unrestricted() bypasses permission enforcement', async () => {
        const dao = createDao(publicUser).unrestricted();
        const entities = await dao.find();
        expect(entities).toHaveLength(allEntityCount);
      });

      it('does not return an unpublished entity to anonymous even when queried by sharedId', async () => {
        const dao = createDao(publicUser);
        expect(await dao.findOne({ sharedId: 'entity2' })).toBeNull();
        expect(await dao.getBySharedId('entity2')).toBeNull();
      });

      it('count honors the access context', async () => {
        const anonymousCount = await createDao(publicUser).count();
        const editorCount = await createDao(editorUser).count();
        expect(anonymousCount).toBe(publishedEntityCount);
        expect(editorCount).toBe(allEntityCount);
      });
    });

    describe('find()', () => {
      it('returns all entities with no filters', async () => {
        const entities = await createDao().find();
        expect(entities).toHaveLength(allEntityCount);
      });

      it('filters by sharedId', async () => {
        const entities = await createDao().find({ sharedId: 'entity1' });
        expect(entities).toHaveLength(2);
        expect(entities.every(e => e.sharedId === 'entity1')).toBe(true);
      });

      it('filters by sharedIds', async () => {
        const entities = await createDao().find({ sharedIds: ['entity1', 'entity3'] });
        expect(entities).toHaveLength(3);
      });

      it('filters by language and languages', async () => {
        expect(await createDao().find({ language: 'es' })).toHaveLength(3);
        expect(await createDao().find({ languages: ['en'] })).toHaveLength(5);
      });

      it('filters by template and templateIds', async () => {
        expect(await createDao().find({ template: factory.idString('t1') })).toHaveLength(5);
        expect(
          await createDao().find({ templateIds: [factory.idString('t1'), factory.idString('t2')] })
        ).toHaveLength(allEntityCount);
      });

      it('filters by languagePairs (OR of sharedId+language)', async () => {
        const entities = await createDao().find({
          languagePairs: [
            { sharedId: 'entity1', language: 'en' },
            { sharedId: 'entity4', language: 'es' },
          ],
        });
        expect(entities).toHaveLength(2);
      });

      it('filters by _id and ids', async () => {
        expect(await createDao().find({ _id: factory.idString('entity1-en') })).toHaveLength(1);
        expect(
          await createDao().find({
            ids: [factory.idString('entity1-en'), factory.idString('entity2-en')],
          })
        ).toHaveLength(2);
      });

      it('filters by idRange', async () => {
        const result = await createDao().find({
          idRange: {
            from: factory.idString('entity1-en'),
            to: factory.idString('entity4-es'),
          },
        });
        const sharedIds = result.map(e => e.sharedId);
        expect(sharedIds).toContain('entity1');
        expect(sharedIds).toContain('entity4');
        expect(result.length).toBeGreaterThanOrEqual(2);
      });

      it('filters by title', async () => {
        const entities = await createDao().find({ title: 'entity1' });
        expect(entities).toHaveLength(2);
      });

      it('filters by titleNotEmpty', async () => {
        const entities = await createDao().find({ titleNotEmpty: true });
        expect(entities).toHaveLength(allEntityCount - 1);
        expect(entities.every(e => e.title !== '')).toBe(true);
      });

      it('filters by published', async () => {
        expect(await createDao().find({ published: true })).toHaveLength(publishedEntityCount);
        expect(await createDao().find({ published: false })).toHaveLength(2);
      });

      it('filters by metadataValueIn', async () => {
        const entities = await createDao().find({
          metadataValueIn: [{ property: 'text_prop', value: 'value1' }],
        });
        expect(entities).toHaveLength(2);
        expect(entities.every(e => e.sharedId === 'entity1')).toBe(true);
      });

      it('filters by metadata exists', async () => {
        const entities = await createDao().find({
          metadata: [{ property: 'text_prop', exists: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('filters by metadata nonEmpty', async () => {
        const entities = await createDao().find({
          metadata: [{ property: 'text_prop', nonEmpty: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('filters by metadata hasValues', async () => {
        const entities = await createDao().find({
          metadata: [{ property: 'text_prop', hasValues: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('combines multiple filters', async () => {
        const entities = await createDao().find({
          language: 'en',
          template: factory.idString('t1'),
        });
        expect(entities).toHaveLength(3);
      });

      it('supports select projections', async () => {
        const entities = await createDao().find(
          { sharedId: 'entity1' },
          { select: ['sharedId', 'title'] }
        );
        expect(entities).toHaveLength(2);
        expect(entities[0].title).toBe('entity1');
        expect((entities[0] as any).metadata).toBeUndefined();
      });

      it('supports sort', async () => {
        const entities = await createDao().find(
          {},
          { sort: [{ field: 'title', direction: 'asc' }] }
        );
        expect(entities[0].title).toBe('');
      });

      it('supports limit', async () => {
        const entities = await createDao().find({}, { limit: 2 });
        expect(entities).toHaveLength(2);
      });
    });

    describe('findOne()', () => {
      it('returns a single matching entity', async () => {
        const entity = await createDao().findOne({ sharedId: 'entity2' });
        expect(entity).not.toBeNull();
        expect(entity!.sharedId).toBe('entity2');
      });

      it('returns the matching language variant', async () => {
        const entity = await createDao().findOne({ sharedId: 'entity1', language: 'en' });
        expect(entity!.language).toBe('en');
      });

      it('returns null when nothing matches', async () => {
        expect(await createDao().findOne({ sharedId: 'nonexistent' })).toBeNull();
      });

      it('supports select projections', async () => {
        const entity = await createDao().findOne(
          { sharedId: 'entity1', language: 'en' },
          { select: ['sharedId', 'title'] }
        );
        expect(entity!.title).toBe('entity1');
        expect((entity as any).metadata).toBeUndefined();
      });
    });

    describe('count()', () => {
      it('counts all entities with no filters', async () => {
        expect(await createDao().count()).toBe(allEntityCount);
      });

      it('counts with filters', async () => {
        expect(await createDao().count({ language: 'es' })).toBe(3);
        expect(await createDao().count({ sharedId: 'entity1' })).toBe(2);
      });

      it('returns 0 when nothing matches', async () => {
        expect(await createDao().count({ sharedId: 'nonexistent' })).toBe(0);
      });
    });

    describe('getIds()', () => {
      it('returns all _id strings with no filters', async () => {
        const ids = await createDao().getIds();
        expect(ids).toHaveLength(allEntityCount);
      });

      it('returns _id strings with filters', async () => {
        const ids = await createDao().getIds({ sharedId: 'entity1' });
        expect(ids).toHaveLength(2);
        expect(ids).toContain(factory.idString('entity1-en'));
      });
    });

    describe('getWithFiles()', () => {
      it('returns entity with documents and attachments separated', async () => {
        const entities = await createDao().getWithFiles({ sharedId: 'entity1', language: 'en' });
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toHaveLength(1);
        expect(entities[0].documents[0].filename).toBe('doc1');
        expect(entities[0].attachments).toHaveLength(1);
        expect(entities[0].attachments[0].filename).toBe('att1');
      });

      it('supports multiple sharedIds', async () => {
        const entities = await createDao().getWithFiles({ sharedIds: ['entity1'] });
        expect(entities).toHaveLength(2);
      });

      it('returns empty array when nothing matches', async () => {
        expect(await createDao().getWithFiles({ sharedId: 'nonexistent' })).toHaveLength(0);
      });

      it('returns empty documents and attachments for entities without files', async () => {
        const entities = await createDao().getWithFiles({ sharedId: 'entity3' });
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toEqual([]);
        expect(entities[0].attachments).toEqual([]);
      });
    });

    describe('getByIdsWithDocuments()', () => {
      it('returns entities with documents and attachments', async () => {
        const entities = await createDao().getByIdsWithDocuments([factory.idString('entity1-en')]);
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toHaveLength(1);
        expect(entities[0].attachments).toHaveLength(1);
      });

      it('returns empty array for empty ids', async () => {
        expect(await createDao().getByIdsWithDocuments([])).toEqual([]);
      });

      it('returns empty array for non-existent ids', async () => {
        expect(await createDao().getByIdsWithDocuments(['nonexistent'])).toEqual([]);
      });

      it('respects the limit option', async () => {
        const entities = await createDao().getByIdsWithDocuments(
          [factory.idString('entity1-en'), factory.idString('entity2-en')],
          { limit: 1 }
        );
        expect(entities).toHaveLength(1);
      });

      it('includes fullText when documentsFullText is true and excludes it by default', async () => {
        const withFullText = await createDao().getByIdsWithDocuments(
          [factory.idString('entity1-en')],
          { documentsFullText: true }
        );
        expect(withFullText[0].documents[0].fullText).toEqual({ 1: 'page one content' });

        const withoutFullText = await createDao().getByIdsWithDocuments([
          factory.idString('entity1-en'),
        ]);
        expect((withoutFullText[0].documents[0] as any).fullText).toBeUndefined();
      });
    });

    describe('getBySharedId()', () => {
      it('returns the entity for the given sharedId and language', async () => {
        const entity = await createDao().getBySharedId('entity1', 'en');
        expect(entity).not.toBeNull();
        expect(entity!.language).toBe('en');
      });

      it('returns one variant when no language is given', async () => {
        const entity = await createDao().getBySharedId('entity1');
        expect(entity).not.toBeNull();
        expect(entity!.sharedId).toBe('entity1');
      });

      it('returns null when nothing matches', async () => {
        expect(await createDao().getBySharedId('nonexistent')).toBeNull();
      });
    });

    describe('getByInternalId()', () => {
      it('returns the entity matching the provided _id', async () => {
        const entity = await createDao().getByInternalId(factory.idString('entity1-en'));
        expect(entity).not.toBeNull();
        expect(entity!.sharedId).toBe('entity1');
        expect(entity!.language).toBe('en');
      });

      it('supports projections', async () => {
        const entity = await createDao().getByInternalId(factory.idString('entity1-en'), {
          title: 1,
          sharedId: 1,
        });
        expect(entity!.title).toBe('entity1');
        expect((entity as any).metadata).toBeUndefined();
      });

      it('returns null when nothing matches', async () => {
        expect(await createDao().getByInternalId(factory.idString('nonexistent'))).toBeNull();
      });
    });

    describe('findBySharedIds()', () => {
      it('returns all language variants for the given sharedIds', async () => {
        const entities = await createDao().findBySharedIds(['entity1', 'entity4']);
        expect(entities).toHaveLength(4);
      });

      it('filters by language', async () => {
        const entities = await createDao().findBySharedIds(['entity1', 'entity4'], 'en');
        expect(entities).toHaveLength(2);
      });

      it('returns empty array for empty sharedIds', async () => {
        expect(await createDao().findBySharedIds([])).toEqual([]);
      });

      it('returns empty array when nothing matches', async () => {
        expect(await createDao().findBySharedIds(['nonexistent'])).toEqual([]);
      });
    });

    describe('countByTemplate()', () => {
      it('counts distinct sharedIds for the given template', async () => {
        expect(await createDao().countByTemplate(factory.idString('t1'))).toBe(4);
        expect(await createDao().countByTemplate(factory.idString('t2'))).toBe(2);
      });

      it('returns 0 for a template with no entities', async () => {
        expect(await createDao().countByTemplate(factory.idString('nonexistent'))).toBe(0);
      });
    });

    describe('countDistinctSharedIds()', () => {
      it('counts distinct sharedIds across all entities', async () => {
        expect(await createDao().countDistinctSharedIds()).toBe(distinctSharedIds.length);
      });
    });

    describe('getSharedIdLabelInfo()', () => {
      it('returns title and icon for the given sharedIds and language', async () => {
        const result = await createDao().getSharedIdLabelInfo(['entity1', 'entity4'], 'en');
        expect(result).toHaveLength(2);
        expect(result.map(r => r.sharedId).sort()).toEqual(['entity1', 'entity4']);
        expect(result.every(r => r.title === r.sharedId)).toBe(true);
      });

      it('returns empty array for empty sharedIds', async () => {
        expect(await createDao().getSharedIdLabelInfo([], 'en')).toEqual([]);
      });

      it('only returns entities matching the language', async () => {
        const result = await createDao().getSharedIdLabelInfo(['entity1'], 'es');
        expect(result).toHaveLength(1);
        expect(result[0].sharedId).toBe('entity1');
      });
    });

    describe('getTitleLabelsBySharedIds()', () => {
      it('returns a per-language label map', async () => {
        const result = await createDao().getTitleLabelsBySharedIds(['entity1'], ['en', 'es']);
        expect(result.get('entity1')).toEqual({ en: 'entity1', es: 'entity1' });
      });

      it('returns an empty map for empty inputs', async () => {
        expect((await createDao().getTitleLabelsBySharedIds([], ['en'])).size).toBe(0);
      });
    });

    describe('cloneForLanguage()', () => {
      it('clones all entities from the source language to the target language', async () => {
        await createDao().cloneForLanguage('en', 'fr');
        const cloned = await createDao().find({ language: 'fr' });
        expect(cloned).toHaveLength(5);
      });

      it('is idempotent (running twice does not create duplicates)', async () => {
        const dao = createDao();
        await dao.cloneForLanguage('en', 'fr');
        await dao.cloneForLanguage('en', 'fr');
        expect(await createDao().find({ language: 'fr' })).toHaveLength(5);
      });

      it('does not overwrite already existing entities for the target language', async () => {
        const existing = factory.entity('entity1', 't1', {}, { language: 'fr', title: 'existing' });
        const fixtures = createFixtures();
        await testingEnvironment.setFixtures({
          ...fixtures,
          entities: [...(fixtures.entities || []), existing],
        });
        await createDao().cloneForLanguage('en', 'fr');
        const entity1fr = await createDao().findOne({ sharedId: 'entity1', language: 'fr' });
        expect(entity1fr!.title).toBe('existing');
      });

      it('calls onBatch with cloned entities having the target language and no _id', async () => {
        const onBatch = jest.fn();
        await createDao().cloneForLanguage('en', 'fr', onBatch);
        expect(onBatch).toHaveBeenCalled();
        const batches = onBatch.mock.calls.flatMap(call => call[0] as any[]);
        expect(batches.length).toBeGreaterThan(0);
        expect(batches.every(e => e.language === 'fr')).toBe(true);
        expect(batches.every(e => !('_id' in e))).toBe(true);
      });
    });

    describe('deleteByLanguage()', () => {
      it('deletes all entities of the given language', async () => {
        await createDao().deleteByLanguage('es');
        expect(await createDao().find({ language: 'es' })).toHaveLength(0);
        expect(await createDao().count()).toBe(allEntityCount - 3);
      });

      it('calls onBatch with the deleted sharedIds', async () => {
        const onBatch = jest.fn();
        await createDao().deleteByLanguage('es', onBatch);
        expect(onBatch).toHaveBeenCalled();
        const sharedIds = onBatch.mock.calls.flatMap(call => call[0] as string[]);
        expect(sharedIds).toEqual(expect.arrayContaining(['entity1', 'entity4', 'entity6']));
      });
    });
  });
});
