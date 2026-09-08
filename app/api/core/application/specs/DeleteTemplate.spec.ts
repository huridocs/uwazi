import { ObjectId } from 'mongodb';
import { TemplateInUseError } from '#api/core/domain/template/errors.js';
import { TemplateDeletedEvent } from '#api/core/domain/template/events/TemplateDeletedEvent.js';
import { DeleteTemplateUseCaseFactory } from '#api/core/infrastructure/factories/DeleteTemplateUseCaseFactory.js';
import { spyOnEmit } from '#api/core/libs/eventsbus/eventTesting.js';
import {
  createEntitiesInAllLanguages,
  fixtures,
  templateToBeDeleted,
  templateToBeEditedId,
  thesaurusTemplate2Id,
  thesaurusTemplate3Id,
  thesaurusTemplateId,
} from '#api/core/v1_layer/templates/specs/fixtures/fixtures.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

type TestConfig = {
  name: string;
  postgresCore: boolean;
  getTemplates: () => Promise<any[]>;
  getTranslations: () => Promise<any[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresCore: false,
    getTemplates: async () => testingEnvironment.db.getAllFrom('templates') as Promise<any[]>,
    getTranslations: async () =>
      testingEnvironment.db.getAllFrom('translationsV2') as Promise<any[]>,
  },
  {
    name: 'Postgres',
    postgresCore: true,
    getTemplates: async () =>
      testingEnvironment.pg
        .getAllFrom('templates')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest) as any[]),
    getTranslations: async () =>
      testingEnvironment.pg
        .getAllFrom('translations')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest) as any[]),
  },
];

describe('DeleteTemplateUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, {
      elasticIndex: 'delete_template_use_case',
      postgres: true,
    });
  });

  beforeEach(async () => {
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore, getTemplates, getTranslations }) => {
    const createSut = () =>
      testingEnvironment.runWithContext(() => DeleteTemplateUseCaseFactory.default(), {
        ...(postgresCore
          ? {
              tenant: {
                ...testingTenants.current(),
                featureFlags: { postgresCore: true },
              },
            }
          : {}),
      });

    it('should delete properties of other templates using this template as select/relationship', async () => {
      await createSut().execute({ templateId: templateToBeDeleted.toString() });

      const allTemplates = await getTemplates();
      const deleted = allTemplates.find(template1 => template1.name === 'to be deleted');

      expect(deleted).not.toBeDefined();
    });

    it('should remove the related metadata from entities using this template as a select/relationship, from all languages', async () => {
      await createSut().execute({ templateId: templateToBeDeleted.toString() });

      const relatedEntities = await db.mongodb
        ?.collection('entities')
        .find({
          template: { $in: [thesaurusTemplateId, thesaurusTemplate2Id, thesaurusTemplate3Id] },
        })
        .sort({ title: 1 })
        .toArray();

      const titles = relatedEntities?.map(e => e.title);
      expect(titles).toEqual([
        't1-1_en',
        't1-1_es',
        't1-1_pt',
        't1-2_en',
        't1-2_es',
        't1-2_pt',
        't1-3_en',
        't1-3_es',
        't1-3_pt',
        't2-1_en',
        't2-1_es',
        't2-1_pt',
      ]);
      ['en', 'es', 'pt'].forEach(l => {
        const metadatas = relatedEntities?.filter(e => e.language === l).map(e => e.metadata);
        expect(metadatas).toMatchObject([
          { select: [] },
          { select: [] },
          { select: [] },
          { select2: [] },
        ]);
      });
    });

    it('should delete a template when no document is using it', async () => {
      const response = await createSut().execute({ templateId: templateToBeDeleted.toString() });

      expect(response).toEqual({ templateId: templateToBeDeleted.toString() });

      const allTemplates = await getTemplates();
      const deleted = allTemplates.find(template1 => template1.name === 'to be deleted');

      expect(deleted).not.toBeDefined();
    });

    it('should delete the template translation', async () => {
      await createSut().execute({ templateId: templateToBeDeleted.toString() });
      const translations = await getTranslations();
      const translation = translations.find(
        t => t.context_id === templateToBeDeleted || t.context?.id === templateToBeDeleted
      );

      expect(translation).not.toBeDefined();
    });

    it(`should emit a ${TemplateDeletedEvent.name} event`, async () => {
      const emitSpy = spyOnEmit();

      await createSut().execute({ templateId: templateToBeDeleted.toString() });

      emitSpy.expectToEmitEvent(TemplateDeletedEvent);
    });

    it('should throw an error when there is documents using it', async () => {
      await testingEnvironment.setFixtures({
        ...fixtures,
        entities: [
          ...fixtures.entities!,
          ...createEntitiesInAllLanguages(
            'templateToBeDeleted entity',
            db.id(templateToBeDeleted),
            {}
          ),
        ],
      });

      try {
        await createSut().execute({ templateId: templateToBeDeleted.toString() });
        throw new Error(
          'should not delete the template and throw an error because there is some documents associated with the template'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateInUseError);
      }
    });

    it('should handle a non existing template', async () => {
      try {
        await createSut().execute({ templateId: new ObjectId().toString() });
      } catch (_) {
        throw new Error(
          'should not delete the template and throw an error because it is the default template'
        );
      }
    });

    it('should throw an error when the template is the default template', async () => {
      try {
        await createSut().execute({ templateId: templateToBeEditedId.toString() });
        throw new Error(
          'should not delete the template and throw an error because it is the default template'
        );
      } catch (error) {
        expect(error.message).toEqual(
          'The default template cannot be deleted. Please set a different template as the default before deleting this one.'
        );
      }
    });
  });
});
