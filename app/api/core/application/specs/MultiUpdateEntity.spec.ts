/* eslint-disable max-statements */
import { MultiUpdateEntityUseCaseFactory } from '#api/core/infrastructure/factories/MultiUpdateEntityUseCaseFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { User } from '#api/users.v2/model/User.js';
import { ObjectId } from 'mongodb';
import { factory, fixtures, permissionsFixtures } from './MultiUpdateEntityFixtures.js';

type TestConfig = {
  name: string;
  postgresTemplates: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresTemplates: false },
  { name: 'Postgres', postgresTemplates: true },
];

const createSut = (actor?: User, postgresTemplates = false) =>
  testingEnvironment.runWithContext(
    () => ({ sut: MultiUpdateEntityUseCaseFactory.default() }),
    postgresTemplates
      ? {
          actor,
          tenant: {
            ...testingTenants.current(),
            featureFlags: { postgresTemplates: true },
          },
        }
      : actor
        ? { actor }
        : undefined
  );

const getAllDocs = async (sharedId: string) =>
  testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

const adminUser = () =>
  User.createFrom({
    _id: new ObjectId(),
    role: 'admin',
    groups: [],
    email: 'admin@test.com',
    username: 'admin',
  });

const editorUser = () =>
  User.createFrom({
    _id: factory.id('editor'),
    role: 'editor',
    groups: [],
    email: 'editor@test.com',
    username: 'editor',
  });

const collaboratorUser = (groups: { _id: ObjectId; name: string }[] = []) =>
  User.createFrom({
    _id: factory.id('collaborator'),
    role: 'collaborator',
    groups,
    email: 'collaborator@test.com',
    username: 'collaborator',
  });

const ALL_PERM_IDS = ['entity_write', 'entity_read', 'entity_group_write', 'entity_no_perm'];

const expectTitles = async (ids: string[], title: string) => {
  await Promise.all(
    ids.map(async id => {
      const docs = await getAllDocs(id);
      const enDoc = docs.find(d => d.language === 'en')!;
      expect(enDoc.title).toBe(title);
    })
  );
};

describe('MultiUpdateEntity', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTemplates }) => {
    describe('when updating property assignments', () => {
      it('should update numeric (non-translatable) across all languages and text (translatable) only in the target language', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        await sut.execute({
          ids: ['entity-1', 'entity-2'],
          targetLanguage: 'en',
          values: {
            propertyAssignments: [
              { name: 'title', value: [{ value: 'Updated EN title' }] },
              { name: 'text', value: [{ value: 'Updated EN text' }] },
              { name: 'numeric', value: [{ value: 99 }] },
            ],
          },
        });

        const entity1Docs = await getAllDocs('entity-1');
        expect(entity1Docs).toHaveLength(2);

        const entity1En = entity1Docs.find(d => d.language === 'en')!;
        const entity1Es = entity1Docs.find(d => d.language === 'es')!;

        expect(entity1En.title).toBe('Updated EN title');
        expect(entity1Es.title).toBe('Entity 1 ES title');

        expect(entity1En.metadata.text).toEqual([{ value: 'Updated EN text' }]);
        expect(entity1Es.metadata.text).toEqual([{ value: 'Entity 1 ES text' }]);

        expect(entity1En.metadata.numeric).toEqual([{ value: 99 }]);
        expect(entity1Es.metadata.numeric).toEqual([{ value: 99 }]);
      });

      it('should update multiselect (non-translatable) across all languages', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        await sut.execute({
          ids: ['entity-1'],
          targetLanguage: 'en',
          values: {
            propertyAssignments: [{ name: 'multiselect', value: [{ value: 'blue_id' }] }],
          },
        });

        const docs = await getAllDocs('entity-1');
        expect(docs).toHaveLength(2);

        docs.forEach(doc => {
          expect(doc.metadata.multiselect).toEqual([{ value: 'blue_id', label: 'Blue' }]);
        });

        const enDoc = docs.find(d => d.language === 'en')!;
        const esDoc = docs.find(d => d.language === 'es')!;
        expect(enDoc.metadata.text).toEqual([{ value: 'Entity 1 EN text' }]);
        expect(esDoc.metadata.text).toEqual([{ value: 'Entity 1 ES text' }]);
      });

      it('should return the mutated Entity array', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        const result = await sut.execute({
          ids: ['entity-1'],
          targetLanguage: 'en',
          values: {
            propertyAssignments: [{ name: 'title', value: [{ value: 'Returned title' }] }],
          },
        });

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0].sharedId).toBe('entity-1');
      });

      it('should do nothing when ids array is empty', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        const result = await sut.execute({
          ids: [],
          targetLanguage: 'en',
          values: {
            propertyAssignments: [{ name: 'title', value: [{ value: 'Should not apply' }] }],
          },
        });

        expect(result).toEqual([]);

        const entity1Docs = await getAllDocs('entity-1');
        entity1Docs.forEach(doc => {
          expect(doc.title).toBe(`Entity 1 ${doc.language!.toUpperCase()} title`);
        });
      });
    });

    describe('when changing template', () => {
      it('should change template and clear metadata not present in the new template', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        await sut.execute({
          ids: ['entity-1'],
          targetLanguage: 'en',
          values: {
            templateId: factory.id('Other Template').toHexString(),
            propertyAssignments: [
              { name: 'title', value: [{ value: 'Title after template change' }] },
              { name: 'other_text', value: [{ value: 'New other text' }] },
            ],
          },
        });

        const docs = await getAllDocs('entity-1');
        const enDoc = docs.find(d => d.language === 'en')!;
        const esDoc = docs.find(d => d.language === 'es')!;

        expect(docs).toHaveLength(2);
        docs.forEach(doc => {
          expect(doc.template).toEqual(factory.id('Other Template'));
          expect(doc.metadata.text).toBeUndefined();
          expect(doc.metadata.numeric).toBeUndefined();
          expect(doc.metadata.multiselect).toBeUndefined();
        });
        expect(enDoc.title).toBe('Title after template change');
        expect(esDoc.title).toBe('Entity 1 ES title');
      });

      it('should change template on each entity individually, regardless of the other entities current template', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        // entity-other is already on Other Template; entity-1 is on Full Template.
        // With a single templateHasChanged flag derived from entities[0], if entity-other
        // happened to be first the flag would be false and entity-1 would never be changed.
        await sut.execute({
          ids: ['entity-other', 'entity-1'],
          targetLanguage: 'en',
          values: {
            templateId: factory.id('Other Template').toHexString(),
          },
        });

        // entity-other was already on Other Template — should remain unchanged
        const otherDocs = await getAllDocs('entity-other');
        otherDocs.forEach(doc => {
          expect(doc.template).toEqual(factory.id('Other Template'));
        });

        // entity-1 was on Full Template — must be changed to Other Template
        const entity1Docs = await getAllDocs('entity-1');
        entity1Docs.forEach(doc => {
          expect(doc.template).toEqual(factory.id('Other Template'));
          expect(doc.metadata.text).toBeUndefined();
          expect(doc.metadata.numeric).toBeUndefined();
          expect(doc.metadata.multiselect).toBeUndefined();
        });
      });

      it('should not change template when templateId matches current template', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        await sut.execute({
          ids: ['entity-1'],
          targetLanguage: 'en',
          values: {
            templateId: factory.id('Full Template').toHexString(),
            propertyAssignments: [{ name: 'title', value: [{ value: 'Same template title' }] }],
          },
        });

        const docs = await getAllDocs('entity-1');
        const enDoc = docs.find(d => d.language === 'en')!;
        const esDoc = docs.find(d => d.language === 'es')!;

        // template remains the same for all languages
        docs.forEach(doc => expect(doc.template).toEqual(factory.id('Full Template')));
        // title is translatable — only EN updated
        expect(enDoc.title).toBe('Same template title');
        expect(esDoc.title).toBe('Entity 1 ES title');
      });
    });

    describe('when no mutations are applied', () => {
      it('should not write to the database if nothing was mutated', async () => {
        const { sut } = createSut(undefined, postgresTemplates);

        // Execute with no icon, no published, no templateId change, no propertyAssignments
        await sut.execute({
          ids: ['entity-1'],
          targetLanguage: 'en',
          values: {},
        });

        const docs = await getAllDocs('entity-1');

        docs.forEach(doc => {
          expect(doc.title).toBe(`Entity 1 ${doc.language!.toUpperCase()} title`);
          expect(doc.icon).toMatchObject({ _id: 'icon-original-1' });
          expect(doc.metadata.text).toEqual([
            { value: `Entity 1 ${doc.language!.toUpperCase()} text` },
          ]);
          expect(doc.metadata.numeric).toEqual([{ value: 10 }]);
        });
      });
    });

    describe('Permissions', () => {
      beforeEach(async () => {
        await testingEnvironment.setFixtures(permissionsFixtures);
      });

      describe('Admin role', () => {
        it('should update all entities regardless of permissions', async () => {
          const { sut } = createSut(adminUser(), postgresTemplates);

          await sut.execute({
            ids: ALL_PERM_IDS,
            targetLanguage: 'en',
            values: {
              propertyAssignments: [{ name: 'title', value: [{ value: 'Admin updated' }] }],
            },
          });

          await expectTitles(ALL_PERM_IDS, 'Admin updated');
        });
      });

      describe('Editor role', () => {
        it('should update all entities regardless of permissions', async () => {
          const { sut } = createSut(editorUser(), postgresTemplates);

          await sut.execute({
            ids: ALL_PERM_IDS,
            targetLanguage: 'en',
            values: {
              propertyAssignments: [{ name: 'title', value: [{ value: 'Editor updated' }] }],
            },
          });

          await expectTitles(ALL_PERM_IDS, 'Editor updated');
        });
      });

      describe('Collaborator role', () => {
        it('should update only entities with write permission via user', async () => {
          const { sut } = createSut(collaboratorUser(), postgresTemplates);

          const result = await sut.execute({
            ids: ['entity_write', 'entity_read', 'entity_no_perm'],
            targetLanguage: 'en',
            values: {
              propertyAssignments: [{ name: 'title', value: [{ value: 'Collaborator updated' }] }],
            },
          });

          // Only entity_write should be updated
          expect(result.map(e => e.sharedId)).toEqual(['entity_write']);

          const writeDocs = await getAllDocs('entity_write');
          expect(writeDocs.find(d => d.language === 'en')!.title).toBe('Collaborator updated');

          const readDocs = await getAllDocs('entity_read');
          readDocs.forEach(doc => expect(doc.title).toBe('Entity Read'));

          const noPermDocs = await getAllDocs('entity_no_perm');
          noPermDocs.forEach(doc => expect(doc.title).toBe('Entity No Perm'));
        });

        it('should update only entities with write permission via group', async () => {
          const { sut } = createSut(
            collaboratorUser([{ _id: factory.id('group1'), name: 'group1' }]),
            postgresTemplates
          );

          const result = await sut.execute({
            ids: ['entity_group_write', 'entity_read', 'entity_no_perm'],
            targetLanguage: 'en',
            values: {
              propertyAssignments: [{ name: 'title', value: [{ value: 'Group updated' }] }],
            },
          });

          expect(result.map(e => e.sharedId)).toEqual(['entity_group_write']);

          const groupWriteDocs = await getAllDocs('entity_group_write');
          expect(groupWriteDocs.find(d => d.language === 'en')!.title).toBe('Group updated');

          const readDocs = await getAllDocs('entity_read');
          readDocs.forEach(doc => expect(doc.title).toBe('Entity Read'));
        });

        it('should return empty array and write nothing when no entities are permitted', async () => {
          const { sut } = createSut(collaboratorUser(), postgresTemplates);

          const result = await sut.execute({
            ids: ['entity_read', 'entity_no_perm'],
            targetLanguage: 'en',
            values: {
              propertyAssignments: [{ name: 'title', value: [{ value: 'Should not apply' }] }],
            },
          });

          expect(result).toEqual([]);

          const readDocs = await getAllDocs('entity_read');
          readDocs.forEach(doc => expect(doc.title).toBe('Entity Read'));

          const noPermDocs = await getAllDocs('entity_no_perm');
          noPermDocs.forEach(doc => expect(doc.title).toBe('Entity No Perm'));
        });
      });
    });
  });
});
