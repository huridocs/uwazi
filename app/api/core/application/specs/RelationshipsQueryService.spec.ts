import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { User } from '#api/users.v2/model/User.js';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';
import { RelationshipsQueryServiceFactory } from '#api/core/infrastructure/factories/RelationshipsQueryServiceFactory.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  enRect1,
  enRect2,
  id,
  relationshipQueryFixtures,
  targetRect,
} from './relationshipQueryFixtures.js';

const admin = User.createFrom({ _id: id('admin').toString(), role: 'admin' });
const editor = User.createFrom({ _id: id('editor').toString(), role: 'editor' });
const collaborator = User.createFrom({ _id: id('collab').toString(), role: 'collaborator' });
const anon = User.createFrom(null);

const service = (actor: User) =>
  testingEnvironment.runWithContext(() => RelationshipsQueryServiceFactory.default(actor), {
    actor,
  });

const summary = async (actor: User, sharedId: string, language: LanguageISO6391 = 'en') =>
  service(actor).getSummary({ sharedId, language });

const names = (rows: { entity: string }[]) => rows.map(row => row.entity).sort();

describe('RelationshipsQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(relationshipQueryFixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('ACL', () => {
    it.each([
      [admin, ['secret', 'source', 'source', 'target']],
      [editor, ['secret', 'source', 'source', 'target']],
      [collaborator, ['source', 'target']],
      [anon, ['source', 'target']],
    ])('filters connected entities by actor', async (actor, expected) => {
      expect(names(await summary(actor, 'source'))).toEqual(expected);
    });

    it('lets a collaborator read an unpublished source they can access', async () => {
      expect(names(await summary(collaborator, 'collabdoc'))).toEqual([
        'collabTarget',
        'collabdoc',
      ]);
    });

    it.each([
      [admin, 'missing'],
      [anon, 'hidden'],
      [collaborator, 'hidden'],
    ])('throws when the source is missing or unreadable', async (actor, sharedId) => {
      await expect(summary(actor, sharedId)).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('graph', () => {
    it('returns file rows with titles and drops redundant entity-level duplicates', async () => {
      const rows = await summary(admin, 'source');
      expect(rows).toHaveLength(4);
      expect(rows).toContainEqual({
        _id: id('hubMain-source-en').toString(),
        hub: id('hubMain').toString(),
        entity: 'source',
        template: null,
        file: id('source-en').toString(),
        entityData: { title: 'Source EN', template: id('tmpl').toString() },
      });
      expect(rows.map(row => row._id)).not.toContain(id('hubMain-source').toString());
    });

    it.each(['orphan', 'lonely', 'fileOnly'])(
      'returns no rows when the graph is empty or dropped (%s)',
      async sharedId => {
        await expect(summary(admin, sharedId)).resolves.toEqual([]);
      }
    );

    it('keeps the current-language file row', async () => {
      const rows = await summary(admin, 'source', 'es');
      expect(rows).toContainEqual(
        expect.objectContaining({
          file: id('source-es').toString(),
          entityData: expect.objectContaining({ title: 'Source ES' }),
        })
      );
    });
  });

  describe('anchors and resolved', () => {
    it('emits the first rectangle for the requested file', async () => {
      await expect(
        service(admin).getAnchors({
          sharedId: 'source',
          file: id('source-en').toString(),
          language: 'en',
        })
      ).resolves.toEqual([
        { _id: id('hubMain-source-en').toString(), reference: { selectionRectangles: [enRect1] } },
      ]);
    });

    it('returns no anchors when the file is not in the requested language', async () => {
      await expect(
        service(admin).getAnchors({
          sharedId: 'source',
          file: id('source-en').toString(),
          language: 'es',
        })
      ).resolves.toEqual([]);
    });

    it('returns text and full rectangles for resolved rows', async () => {
      const rows = await service(admin).getResolved({ sharedId: 'source', language: 'en' });
      expect(rows).toHaveLength(2);
      expect(rows).toEqual(
        expect.arrayContaining([
          {
            _id: id('hubMain-source-en').toString(),
            reference: { text: 'en quote', selectionRectangles: [enRect1, enRect2] },
          },
          {
            _id: id('hubMain-target-en').toString(),
            reference: { text: 'target quote', selectionRectangles: [targetRect] },
          },
        ])
      );
    });
  });
});
