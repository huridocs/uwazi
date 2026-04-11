/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { tenants } from '#api/tenants/index.js';
import { ContextDependencies, DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { MultiUpdateEntity, MultiUpdateEntityDeps } from '../MultiUpdateEntity.js';
import { UserSchema } from '#shared/types/userType.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import {
  factory,
  fixtures,
  permissionsFixtures,
  SampleListener,
} from './MultiUpdateEntityFixtures.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';

const createSut = (actor?: UserSchema, _deps?: Partial<MultiUpdateEntityDeps>) => {
  const transactionManager = TransactionManagerFactory.default();
  const entitiesDS = EntitiesDataSourceFactory.forTesting(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const eventEmitter = EventEmitterFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
  const entityPermissionChecker = new MongoEntityPermissionChecker(
    getConnection(),
    transactionManager
  );

  const propertyAssignmentCreatorServiceStrategy =
    PropertyAssignmentCreatorServiceStrategy.createWithRequired({
      entitiesDS,
      settingsDS,
      thesauriDS,
      translationsDS,
    });

  const entitiesService = EntitiesServiceFactory.default({
    transactionManager,
    entitiesDS,
    eventEmitter,
    settingsDS,
    templatesDS,
  });

  const defaultActor: UserSchema = {
    _id: new ObjectId(),
    role: 'admin',
    groups: [],
    email: 'admin@test.com',
    username: 'admin',
  };

  const sut = new MultiUpdateEntity(
    {
      entitiesDS,
      entitiesService,
      templatesDS,
      propertyAssignmentCreatorServiceStrategy,
      entityPermissionChecker,
      transactionManager,
      eventEmitter,
      idGenerator,
      ..._deps,
    },
    { actor: actor ?? defaultActor, tenant: tenants.current() }
  );

  DependenciesContext.attachContext(sut, 'execute', {
    factories: {
      transactionManager: () => transactionManager,
      eventEmitter: () => eventEmitter,
      idGenerator: () => idGenerator,
      jobsDispatcher: () => jobsDispatcher,
      logger: () => TestUtils.mockClass<Logger>({}),
      authorizedEntityESClient: () => TestUtils.mockClass({}),
      elasticClient: () => TestUtils.mockClass({}),
    },
  });

  return { sut };
};

const getAllDocs = async (sharedId: string) =>
  testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

describe('MultiUpdateEntity', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
    EventEmitterFactory.default().listen(SampleListener);
    const tenant = tenants.current();
    jest.spyOn(DependenciesContext, 'getStore').mockReturnValue({
      instances: {
        elasticClient: ElasticSearchClientFactory.tenantAware(tenant.name),
      },
      factories: {},
    } as ContextDependencies);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    EventEmitterFactory.default().reset();
  });

  describe('when updating property assignments', () => {
    it('should update numeric (non-translatable) across all languages and text (translatable) only in the target language', async () => {
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
      const { sut } = createSut();

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
        const adminUser: UserSchema = {
          _id: new ObjectId(),
          role: 'admin',
          groups: [],
          email: 'admin@test.com',
          username: 'admin',
        } as UserSchema;

        const { sut } = createSut(adminUser);

        await sut.execute({
          ids: ['entity_write', 'entity_read', 'entity_group_write', 'entity_no_perm'],
          targetLanguage: 'en',
          values: { propertyAssignments: [{ name: 'title', value: [{ value: 'Admin updated' }] }] },
        });

        const allIds = ['entity_write', 'entity_read', 'entity_group_write', 'entity_no_perm'];
        await Promise.all(
          allIds.map(async id => {
            const docs = await getAllDocs(id);
            const enDoc = docs.find(d => d.language === 'en')!;
            expect(enDoc.title).toBe('Admin updated');
          })
        );
      });
    });

    describe('Editor role', () => {
      it('should update all entities regardless of permissions', async () => {
        const editorUser: UserSchema = {
          _id: factory.id('editor'),
          role: 'editor',
          groups: [],
          email: 'editor@test.com',
          username: 'editor',
        } as UserSchema;

        const { sut } = createSut(editorUser);

        await sut.execute({
          ids: ['entity_write', 'entity_read', 'entity_group_write', 'entity_no_perm'],
          targetLanguage: 'en',
          values: {
            propertyAssignments: [{ name: 'title', value: [{ value: 'Editor updated' }] }],
          },
        });

        const allIds = ['entity_write', 'entity_read', 'entity_group_write', 'entity_no_perm'];
        await Promise.all(
          allIds.map(async id => {
            const docs = await getAllDocs(id);
            const enDoc = docs.find(d => d.language === 'en')!;
            expect(enDoc.title).toBe('Editor updated');
          })
        );
      });
    });

    describe('Collaborator role', () => {
      const collaboratorId = factory.id('collaborator');

      it('should update only entities with write permission via user', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut(collaboratorUser);

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
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: factory.id('group1'), name: 'group1' }] as any,
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut(collaboratorUser);

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
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut(collaboratorUser);

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
