/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
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
      it('should return only published entities for anonymous users', async () => {
        const dao = createDao(publicUser);
        const entities = await dao.find();
        expect(entities).toHaveLength(publishedEntityCount);
      });

      it('should return published + explicitly shared entities for a collaborator', async () => {
        const dao = createDao(collaboratorUser);
        const entities = await dao.find();
        const sharedIds = entities.map(e => e.sharedId);
        expect(entities).toHaveLength(publishedEntityCount + 1);
        expect(sharedIds).toContain('entity5');
        expect(sharedIds).not.toContain('entity2');
      });

      it('should return only published entities for a collaborator without matching permissions', async () => {
        const dao = createDao(otherCollaborator);
        const entities = await dao.find();
        expect(entities).toHaveLength(publishedEntityCount);
      });

      it('should return all entities for editor and admin users', async () => {
        const editorEntities = await createDao(editorUser).find();
        const adminEntities = await createDao(adminUser).find();
        expect(editorEntities).toHaveLength(allEntityCount);
        expect(adminEntities).toHaveLength(allEntityCount);
      });

      it('should bypass permission enforcement via unrestricted()', async () => {
        const dao = createDao(publicUser).unrestricted();
        const entities = await dao.find();
        expect(entities).toHaveLength(allEntityCount);
      });

      it('should not return an unpublished entity to anonymous even when queried by sharedId', async () => {
        const dao = createDao(publicUser);
        expect(await dao.findOne({ sharedId: 'entity2' })).toBeNull();
        expect(await dao.getBySharedId('entity2')).toEqual([]);
      });

      it('should honor the access context in count()', async () => {
        const anonymousCount = await createDao(publicUser).count();
        const editorCount = await createDao(editorUser).count();
        expect(anonymousCount).toBe(publishedEntityCount);
        expect(editorCount).toBe(allEntityCount);
      });
    });

    describe('find()', () => {
      it('should return all entities with no filters', async () => {
        const entities = await createDao().find();
        expect(entities).toHaveLength(allEntityCount);
      });

      it('should filter by sharedId', async () => {
        const entities = await createDao().find({ sharedId: 'entity1' });
        expect(entities).toHaveLength(2);
        expect(entities.every(e => e.sharedId === 'entity1')).toBe(true);
      });

      it('should filter by sharedIds', async () => {
        const entities = await createDao().find({ sharedIds: ['entity1', 'entity3'] });
        expect(entities).toHaveLength(3);
      });

      it('should return no entities for an empty sharedIds filter', async () => {
        const entities = await createDao().find({ sharedIds: [] });
        expect(entities).toEqual([]);
      });

      it('should filter by language and languages', async () => {
        expect(await createDao().find({ language: 'es' })).toHaveLength(3);
        expect(await createDao().find({ languages: ['en'] })).toHaveLength(5);
      });

      it('should return no entities for an empty languages filter', async () => {
        expect(await createDao().find({ languages: [] })).toEqual([]);
      });

      it('should filter by template and templateIds', async () => {
        expect(await createDao().find({ template: factory.idString('t1') })).toHaveLength(5);
        expect(
          await createDao().find({ templateIds: [factory.idString('t1'), factory.idString('t2')] })
        ).toHaveLength(allEntityCount);
      });

      it('should return no entities for an empty templateIds filter', async () => {
        expect(await createDao().find({ templateIds: [] })).toEqual([]);
      });

      it('should filter by _id and ids', async () => {
        expect(await createDao().find({ _id: factory.idString('entity1-en') })).toHaveLength(1);
        expect(
          await createDao().find({
            ids: [factory.idString('entity1-en'), factory.idString('entity2-en')],
          })
        ).toHaveLength(2);
      });

      it('should return no entities for an empty ids filter', async () => {
        expect(await createDao().find({ ids: [] })).toEqual([]);
      });

      it('should return no entities for an invalid _id filter', async () => {
        expect(await createDao().find({ _id: 'invalid' })).toEqual([]);
      });

      it('should return no entities for an empty-string sharedId filter', async () => {
        expect(await createDao().find({ sharedId: '' })).toEqual([]);
      });

      it('should return no entities for an empty-string language filter', async () => {
        expect(await createDao().find({ language: '' })).toEqual([]);
      });

      it('should return no entities for an empty-string template filter', async () => {
        expect(await createDao().find({ template: '' })).toEqual([]);
      });

      it('should return only entities with an empty title for an empty-string title filter', async () => {
        const entities = await createDao().find({ title: '' });
        expect(entities.map(e => e.sharedId)).toEqual(['entity6']);
      });

      it('should filter by title', async () => {
        const entities = await createDao().find({ title: 'entity1' });
        expect(entities).toHaveLength(2);
      });

      it('should filter by titleNotEmpty', async () => {
        const entities = await createDao().find({ titleNotEmpty: true });
        expect(entities).toHaveLength(allEntityCount - 1);
        expect(entities.every(e => e.title !== '')).toBe(true);
      });

      it('should filter by published', async () => {
        expect(await createDao().find({ published: true })).toHaveLength(publishedEntityCount);
        expect(await createDao().find({ published: false })).toHaveLength(2);
      });

      it('should filter by metadataValueIn', async () => {
        const entities = await createDao().find({
          metadataValueIn: [{ property: 'text_prop', value: 'value1' }],
        });
        expect(entities).toHaveLength(2);
        expect(entities.every(e => e.sharedId === 'entity1')).toBe(true);
      });

      it('should return no entities for an empty metadataValueIn filter', async () => {
        expect(await createDao().find({ metadataValueIn: [] })).toEqual([]);
      });

      it('should combine multiple filters', async () => {
        const entities = await createDao().find({
          language: 'en',
          template: factory.idString('t1'),
        });
        expect(entities).toHaveLength(3);
      });

      it('should support select projections', async () => {
        const entities = await createDao().find(
          { sharedId: 'entity1' },
          { select: ['sharedId', 'title'] }
        );
        expect(entities).toHaveLength(2);
        expect(entities[0].title).toBe('entity1');
        expect((entities[0] as any).metadata).toBeUndefined();
      });

      it('should support sort', async () => {
        const entities = await createDao().find(
          {},
          { sort: [{ field: 'title', direction: 'asc' }] }
        );
        expect(entities[0].title).toBe('');
      });

      it('should support limit', async () => {
        const entities = await createDao().find({}, { limit: 2 });
        expect(entities).toHaveLength(2);
      });
    });

    describe('findOne()', () => {
      it('should return a single matching entity', async () => {
        const entity = await createDao().findOne({ sharedId: 'entity2' });
        expect(entity).not.toBeNull();
        expect(entity!.sharedId).toBe('entity2');
      });

      it('should return the matching language variant', async () => {
        const entity = await createDao().findOne({ sharedId: 'entity1', language: 'en' });
        expect(entity!.language).toBe('en');
      });

      it('should return null when nothing matches', async () => {
        expect(await createDao().findOne({ sharedId: 'nonexistent' })).toBeNull();
      });

      it('should support select projections', async () => {
        const entity = await createDao().findOne(
          { sharedId: 'entity1', language: 'en' },
          { select: ['sharedId', 'title'] }
        );
        expect(entity!.title).toBe('entity1');
        expect((entity as any).metadata).toBeUndefined();
      });
    });

    describe('count()', () => {
      it('should count all entities with no filters', async () => {
        expect(await createDao().count()).toBe(allEntityCount);
      });

      it('should count with filters', async () => {
        expect(await createDao().count({ language: 'es' })).toBe(3);
        expect(await createDao().count({ sharedId: 'entity1' })).toBe(2);
      });

      it('should return 0 when nothing matches', async () => {
        expect(await createDao().count({ sharedId: 'nonexistent' })).toBe(0);
      });

      it('should return 0 for an empty-string sharedId filter', async () => {
        expect(await createDao().count({ sharedId: '' })).toBe(0);
      });
    });

    describe('getIds()', () => {
      it('should return all _id strings with no filters', async () => {
        const ids = await createDao().getIds();
        expect(ids).toHaveLength(allEntityCount);
      });

      it('should return _id strings with filters', async () => {
        const ids = await createDao().getIds({ sharedId: 'entity1' });
        expect(ids).toHaveLength(2);
        expect(ids).toContain(factory.idString('entity1-en'));
      });

      it('should return no ids for an empty-string sharedId filter', async () => {
        expect(await createDao().getIds({ sharedId: '' })).toEqual([]);
      });
    });

    describe('findByLanguagePairs()', () => {
      it('should match (sharedId, language) tuples as an OR', async () => {
        const entities = await createDao().findByLanguagePairs({
          pairs: [
            { sharedId: 'entity1', language: 'en' },
            { sharedId: 'entity4', language: 'es' },
          ],
        });
        expect(entities).toHaveLength(2);
      });

      it('should return empty array for empty pairs', async () => {
        expect(await createDao().findByLanguagePairs({ pairs: [] })).toEqual([]);
      });

      it('should return empty array when nothing matches', async () => {
        expect(
          await createDao().findByLanguagePairs({
            pairs: [{ sharedId: 'nonexistent', language: 'en' }],
          })
        ).toEqual([]);
      });

      it('should support limit', async () => {
        const entities = await createDao().findByLanguagePairs(
          {
            pairs: [
              { sharedId: 'entity1', language: 'en' },
              { sharedId: 'entity1', language: 'es' },
              { sharedId: 'entity4', language: 'es' },
            ],
          },
          { limit: 2 }
        );
        expect(entities).toHaveLength(2);
      });
    });

    describe('findByTemplateIdRange()', () => {
      it('should return entities within the inclusive _id range for the given template', async () => {
        const result = await createDao().findByTemplateIdRange({
          templateId: factory.idString('t1'),
          from: factory.idString('entity1-en'),
          to: factory.idString('entity4-es'),
        });
        const sharedIds = result.map(e => e.sharedId);
        expect(sharedIds).toContain('entity1');
        expect(sharedIds).toContain('entity2');
        expect(sharedIds).not.toContain('entity5');
        expect(result.every(e => e.template.toString() === factory.idString('t1'))).toBe(true);
      });

      it('should support a from-only range', async () => {
        const result = await createDao().findByTemplateIdRange({
          templateId: factory.idString('t1'),
          from: factory.idString('entity2-en'),
        });
        const sharedIds = result.map(e => e.sharedId);
        expect(sharedIds).toContain('entity2');
        expect(sharedIds).toContain('entity5');
        expect(sharedIds).not.toContain('entity1');
      });

      it('should support a to-only range', async () => {
        const result = await createDao().findByTemplateIdRange({
          templateId: factory.idString('t1'),
          to: factory.idString('entity2-en'),
        });
        const sharedIds = result.map(e => e.sharedId);
        expect(sharedIds).toContain('entity1');
        expect(sharedIds).toContain('entity2');
        expect(sharedIds).not.toContain('entity5');
      });

      it('should filter by language within the range', async () => {
        const result = await createDao().findByTemplateIdRange({
          templateId: factory.idString('t1'),
          from: factory.idString('entity1-en'),
          to: factory.idString('entity4-es'),
          language: 'en',
        });
        expect(result).toHaveLength(2);
        expect(result.every(e => e.language === 'en')).toBe(true);
      });

      it('should return empty array when nothing matches', async () => {
        expect(
          await createDao().findByTemplateIdRange({
            templateId: factory.idString('nonexistent'),
            from: factory.idString('entity1-en'),
            to: factory.idString('entity4-es'),
          })
        ).toEqual([]);
      });

      it('should return empty array when the from bound is invalid', async () => {
        expect(
          await createDao().findByTemplateIdRange({
            templateId: factory.idString('t1'),
            from: 'invalid',
            to: factory.idString('entity4-es'),
          })
        ).toEqual([]);
      });

      it('should return empty array when the to bound is invalid', async () => {
        expect(
          await createDao().findByTemplateIdRange({
            templateId: factory.idString('t1'),
            from: factory.idString('entity1-en'),
            to: 'invalid',
          })
        ).toEqual([]);
      });

      it('should return empty array when both bounds are invalid', async () => {
        expect(
          await createDao().findByTemplateIdRange({
            templateId: factory.idString('t1'),
            from: 'invalid',
            to: 'invalid',
          })
        ).toEqual([]);
      });

      it('should return empty array for an empty-string language filter', async () => {
        expect(
          await createDao().findByTemplateIdRange({
            templateId: factory.idString('t1'),
            language: '',
          })
        ).toEqual([]);
      });
    });

    describe('findByMetadataCriteria()', () => {
      it('should filter by metadata exists', async () => {
        const entities = await createDao().findByMetadataCriteria({
          criteria: [{ property: 'text_prop', exists: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('should filter by metadata nonEmpty', async () => {
        const entities = await createDao().findByMetadataCriteria({
          criteria: [{ property: 'text_prop', nonEmpty: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('should filter by metadata hasValues', async () => {
        const entities = await createDao().findByMetadataCriteria({
          criteria: [{ property: 'text_prop', hasValues: true }],
        });
        expect(entities).toHaveLength(3);
      });

      it('should treat the string "null" as a value for hasValues', async () => {
        const fixtures = createFixtures();
        const nullValueEntity = factory.entity(
          'entity-null-value',
          't1',
          { text_prop: [factory.metadataValue('null')] },
          { published: true }
        );
        await testingEnvironment.setFixtures({
          ...fixtures,
          entities: [...(fixtures.entities || []), nullValueEntity],
        });

        const entities = await createDao().findByMetadataCriteria({
          criteria: [{ property: 'text_prop', hasValues: true }],
        });
        expect(entities.map(e => e.sharedId)).toContain('entity-null-value');
      });

      it('should combine multiple criteria as an AND', async () => {
        const entities = await createDao().findByMetadataCriteria({
          criteria: [
            { property: 'text_prop', exists: true },
            { property: 'rel_prop', exists: true },
          ],
        });
        expect(entities).toHaveLength(2);
        expect(entities.every(e => e.sharedId === 'entity1')).toBe(true);
      });

      it('should support anchor filters combined with criteria', async () => {
        const entities = await createDao().findByMetadataCriteria({
          criteria: [{ property: 'text_prop', exists: true }],
          filters: { templateIds: [factory.idString('t1')], titleNotEmpty: true },
        });
        expect(entities).toHaveLength(3);
      });

      it('should support limit', async () => {
        const entities = await createDao().findByMetadataCriteria(
          { criteria: [{ property: 'text_prop', exists: true }] },
          { limit: 2 }
        );
        expect(entities).toHaveLength(2);
      });
    });

    describe('getWithFiles()', () => {
      it('should return entity with documents and attachments separated', async () => {
        const entities = await createDao().getWithFiles({ sharedId: 'entity1', language: 'en' });
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toHaveLength(1);
        expect(entities[0].documents[0].filename).toBe('doc1');
        expect(entities[0].attachments).toHaveLength(1);
        expect(entities[0].attachments[0].filename).toBe('att1');
      });

      it('should support multiple sharedIds', async () => {
        const entities = await createDao().getWithFiles({ sharedIds: ['entity1'] });
        expect(entities).toHaveLength(2);
      });

      it('should prefer sharedIds over sharedId when both are provided', async () => {
        const entities = await createDao().getWithFiles({
          sharedId: 'entity1',
          sharedIds: ['entity3'],
        });
        expect(entities.map(e => e.sharedId)).toEqual(['entity3']);
      });

      it('should return empty array for an empty sharedIds filter', async () => {
        expect(await createDao().getWithFiles({ sharedIds: [] })).toEqual([]);
      });

      it('should return empty array for an empty-string sharedId', async () => {
        expect(await createDao().getWithFiles({ sharedId: '' })).toEqual([]);
      });

      it('should return empty array for an empty-string language', async () => {
        expect(await createDao().getWithFiles({ language: '' as any })).toEqual([]);
      });

      it('should return empty array when nothing matches', async () => {
        expect(await createDao().getWithFiles({ sharedId: 'nonexistent' })).toHaveLength(0);
      });

      it('should return empty documents and attachments for entities without files', async () => {
        const entities = await createDao().getWithFiles({ sharedId: 'entity3' });
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toEqual([]);
        expect(entities[0].attachments).toEqual([]);
      });
    });

    describe('getByIdsWithDocuments()', () => {
      it('should return entities with documents and attachments', async () => {
        const entities = await createDao().getByIdsWithDocuments([factory.idString('entity1-en')]);
        expect(entities).toHaveLength(1);
        expect(entities[0].documents).toHaveLength(1);
        expect(entities[0].attachments).toHaveLength(1);
      });

      it('should return empty array for empty ids', async () => {
        expect(await createDao().getByIdsWithDocuments([])).toEqual([]);
      });

      it('should return empty array for non-existent ids', async () => {
        expect(await createDao().getByIdsWithDocuments(['nonexistent'])).toEqual([]);
      });

      it('should respect the limit option', async () => {
        const entities = await createDao().getByIdsWithDocuments(
          [factory.idString('entity1-en'), factory.idString('entity2-en')],
          { limit: 1 }
        );
        expect(entities).toHaveLength(1);
      });

      it('should include fullText when documentsFullText is true and excludes it by default', async () => {
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
      it('should return the entity for the given sharedId and language', async () => {
        const entity = await createDao().getBySharedId('entity1', 'en');
        expect(entity).not.toBeNull();
        expect((entity as EntityDBO).language).toBe('en');
      });

      it('should return all language variants when no language is given', async () => {
        const entities = await createDao().getBySharedId('entity1');
        expect(Array.isArray(entities)).toBe(true);
        expect(entities).toHaveLength(2);
        expect(entities.every((e: EntityDBO) => e.sharedId === 'entity1')).toBe(true);
      });

      it('should return null when language is given and nothing matches', async () => {
        expect(await createDao().getBySharedId('nonexistent', 'en')).toBeNull();
      });

      it('should return empty array when no language is given and nothing matches', async () => {
        expect(await createDao().getBySharedId('nonexistent')).toEqual([]);
      });

      it('should return empty array for an empty-string sharedId', async () => {
        expect(await createDao().getBySharedId('')).toEqual([]);
      });

      it('should return null for an empty-string language', async () => {
        expect(await createDao().getBySharedId('entity1', '' as any)).toBeNull();
      });
    });

    describe('getByInternalId()', () => {
      it('should return the entity matching the provided _id', async () => {
        const entity = await createDao().getByInternalId(factory.idString('entity1-en'));
        expect(entity).not.toBeNull();
        expect(entity!.sharedId).toBe('entity1');
        expect(entity!.language).toBe('en');
      });

      it('should support projections', async () => {
        const entity = await createDao().getByInternalId(factory.idString('entity1-en'), {
          title: 1,
          sharedId: 1,
        });
        expect(entity!.title).toBe('entity1');
        expect((entity as any).metadata).toBeUndefined();
      });

      it('should return null when nothing matches', async () => {
        expect(await createDao().getByInternalId(factory.idString('nonexistent'))).toBeNull();
      });

      it('should return null for an empty-string id', async () => {
        expect(await createDao().getByInternalId('')).toBeNull();
      });
    });

    describe('countByTemplate()', () => {
      it('should count distinct sharedIds for the given template', async () => {
        expect(await createDao().countByTemplate(factory.idString('t1'))).toBe(4);
        expect(await createDao().countByTemplate(factory.idString('t2'))).toBe(2);
      });

      it('should return 0 for a template with no entities', async () => {
        expect(await createDao().countByTemplate(factory.idString('nonexistent'))).toBe(0);
      });
    });

    describe('countDistinctSharedIds()', () => {
      it('should count distinct sharedIds across all entities', async () => {
        expect(await createDao().countDistinctSharedIds()).toBe(distinctSharedIds.length);
      });
    });

    describe('getSharedIdLabelInfo()', () => {
      it('should return title and icon for the given sharedIds and language', async () => {
        const result = await createDao().getSharedIdLabelInfo(['entity1', 'entity4'], 'en');
        expect(result).toHaveLength(2);
        expect(result.map(r => r.sharedId).sort()).toEqual(['entity1', 'entity4']);
        expect(result.every(r => r.title === r.sharedId)).toBe(true);
      });

      it('should return empty array for empty sharedIds', async () => {
        expect(await createDao().getSharedIdLabelInfo([], 'en')).toEqual([]);
      });

      it('should only return entities matching the language', async () => {
        const result = await createDao().getSharedIdLabelInfo(['entity1'], 'es');
        expect(result).toHaveLength(1);
        expect(result[0].sharedId).toBe('entity1');
      });
    });

    describe('getTitleLabelsBySharedIds()', () => {
      it('should return a per-language label map', async () => {
        const result = await createDao().getTitleLabelsBySharedIds(['entity1'], ['en', 'es']);
        expect(result.get('entity1')).toEqual({ en: 'entity1', es: 'entity1' });
      });

      it('should return an empty map for empty inputs', async () => {
        expect((await createDao().getTitleLabelsBySharedIds([], ['en'])).size).toBe(0);
      });
    });

    describe('cloneForLanguage()', () => {
      it('should clone all entities from the source language to the target language', async () => {
        await createDao().cloneForLanguage('en', 'fr');
        const cloned = await createDao().find({ language: 'fr' });
        expect(cloned).toHaveLength(5);
      });

      it('should be idempotent on Mongo; a second run fails on Postgres (unique index)', async () => {
        const dao = createDao();
        await dao.cloneForLanguage('en', 'fr');
        if (usePostgres) {
          // Plain insert + unique (tenant_id, sharedId, language) index:
          // re-cloning into a populated language violates the constraint.
          await expect(dao.cloneForLanguage('en', 'fr')).rejects.toThrow();
        } else {
          // Mongo $setOnInsert upsert is a no-op for existing rows.
          await dao.cloneForLanguage('en', 'fr');
          expect(await createDao().find({ language: 'fr' })).toHaveLength(5);
        }
      });

      it('should reject on Postgres when the target language already has entities; preserves them on Mongo', async () => {
        const existing = factory.entity('entity1', 't1', {}, { language: 'fr', title: 'existing' });
        const fixtures = createFixtures();
        await testingEnvironment.setFixtures({
          ...fixtures,
          entities: [...(fixtures.entities || []), existing],
        });
        if (usePostgres) {
          await expect(createDao().cloneForLanguage('en', 'fr')).rejects.toThrow();
        } else {
          await createDao().cloneForLanguage('en', 'fr');
          const entity1fr = await createDao().findOne({ sharedId: 'entity1', language: 'fr' });
          expect(entity1fr!.title).toBe('existing');
        }
      });

      it('should call onBatch with cloned entities having the target language and no _id', async () => {
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
      it('should delete all entities of the given language', async () => {
        await createDao().deleteByLanguage('es');
        expect(await createDao().find({ language: 'es' })).toHaveLength(0);
        expect(await createDao().count()).toBe(allEntityCount - 3);
      });

      it('should call onBatch with the deleted sharedIds', async () => {
        const onBatch = jest.fn();
        await createDao().deleteByLanguage('es', onBatch);
        expect(onBatch).toHaveBeenCalled();
        const sharedIds = onBatch.mock.calls.flatMap(call => call[0] as string[]);
        expect(sharedIds).toEqual(expect.arrayContaining(['entity1', 'entity4', 'entity6']));
      });
    });
  });
});
