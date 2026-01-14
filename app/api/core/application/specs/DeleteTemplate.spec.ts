/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DeleteTemplateUseCaseFactory } from 'api/core/infrastructure/factories/DeleteTemplateUseCaseFactory';
import fixtures, {
  createEntitiesInAllLanguages,
  templateToBeDeleted,
  templateToBeEditedId,
  thesaurusTemplate2Id,
  thesaurusTemplate3Id,
  thesaurusTemplateId,
} from 'api/core/v1_layer/templates/specs/fixtures/fixtures';
import templates from 'api/core/v1_layer/templates';
import db from 'api/utils/testing_db';
import documents from 'api/documents';
import { TemplateDeletedEvent } from 'api/core/domain/template/events/TemplateDeletedEvent';
import { spyOnEmit } from 'api/core/libs/eventsbus/eventTesting';
import { ObjectId } from 'mongodb';
import { TemplateInUseError } from 'api/core/domain/template/errors';
import * as setupSockets from 'api/socketio/setupSockets';

describe('DeleteTemplateUseCase', () => {
  beforeEach(async () => {
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
    await testingEnvironment.setUp(fixtures, 'delete_template_use_case');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete properties of other templates using this template as select/relationship', async () => {
    await (
      await DeleteTemplateUseCaseFactory.create()
    ).execute({ templateId: templateToBeDeleted.toString() });

    const [template1] = await templates.get({ name: 'thesauri template' });

    expect(template1?.properties?.length).toBe(1);
    expect(template1?.properties?.[0]?.label).toBe('select');

    const [template2] = await templates.get({ name: 'thesauri template 2' });
    expect(template2?.properties?.length).toBe(1);
    expect(template2?.properties?.[0]?.label).toBe('select2');

    const [template3] = await templates.get({ name: 'thesauri template 3' });
    expect(template3?.properties?.length).toBe(2);
    expect(template3?.properties?.[0]?.label).toBe('text');
    expect(template3?.properties?.[1]?.label).toBe('text2');
  });

  it('should remove the related metadata from entities using this template as a select/relationship, from all languages', async () => {
    await (
      await DeleteTemplateUseCaseFactory.create()
    ).execute({ templateId: templateToBeDeleted.toString() });

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
    jest.spyOn(templates, 'countByTemplate').mockImplementation(async () => Promise.resolve(0));

    const response = await (
      await DeleteTemplateUseCaseFactory.create()
    ).execute({ templateId: templateToBeDeleted.toString() });

    expect(response).toEqual({ templateId: templateToBeDeleted.toString() });

    const allTemplates = await templates.get();
    const deleted = allTemplates.find(template1 => template1.name === 'to be deleted');

    expect(deleted).not.toBeDefined();
  });

  it('should delete the template translation', async () => {
    jest.spyOn(documents, 'countByTemplate').mockImplementation(async () => Promise.resolve(0));

    await (
      await DeleteTemplateUseCaseFactory.create()
    ).execute({ templateId: templateToBeDeleted.toString() });
    const translation = await testingEnvironment.db
      .getCollection('translationsV2')
      ?.findOne({ 'context.id': templateToBeDeleted });

    expect(translation).toBeNull();
  });

  it(`should emit a ${TemplateDeletedEvent.name} event`, async () => {
    const emitSpy = spyOnEmit();

    await (
      await DeleteTemplateUseCaseFactory.create()
    ).execute({ templateId: templateToBeDeleted.toString() });

    emitSpy.expectToEmitEvent(TemplateDeletedEvent);
  });

  it('should throw an error when there is documents using it', async () => {
    jest.spyOn(templates, 'countByTemplate').mockImplementation(async () => Promise.resolve(1));
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
      await (
        await DeleteTemplateUseCaseFactory.create()
      ).execute({ templateId: templateToBeDeleted.toString() });
      throw new Error(
        'should not delete the template and throw an error because there is some documents associated with the template'
      );
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateInUseError);
    }
  });

  it('should handle a non existing template', async () => {
    try {
      await (
        await DeleteTemplateUseCaseFactory.create()
      ).execute({ templateId: new ObjectId().toString() });
    } catch (error) {
      throw new Error(
        'should not delete the template and throw an error because it is the default template'
      );
    }
  });

  it('should throw an error when the template is the default template', async () => {
    try {
      await (
        await DeleteTemplateUseCaseFactory.create()
      ).execute({ templateId: templateToBeEditedId.toString() });
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
