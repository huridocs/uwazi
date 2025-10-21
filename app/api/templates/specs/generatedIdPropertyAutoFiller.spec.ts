import entities from 'api/entities';
import translations from 'api/i18n';
import { elastic } from 'api/search';
import {
  fixtures,
  templateId,
  textPropertyId,
} from 'api/templates/specs/generatedIdPropertyAutoFillerFixtures';
import { elasticTesting } from 'api/utils/elastic_testing';
import { unique } from 'api/utils/filters';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import * as setupSockets from 'api/socketio/setupSockets';
import { propertyTypes } from 'shared/propertyTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { ObjectId } from 'mongodb';

describe('generatedId property auto filler', () => {
  beforeAll(async () => {
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation(async () => Promise.resolve());
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    await testingEnvironment.setUp(fixtures, 'generated_id_auto_filler_index');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('fill generated id fields for entities of a specified template', () => {
    let affectedEntities: EntitySchema[];
    beforeAll(async () => {
      await TemplateFacade.update(
        {
          _id: templateId,
          name: 'template',

          commonProperties: [
            { _id: new ObjectId(), name: 'title', label: 'Title', type: PropertyTypeEnum.Text },
            {
              _id: new ObjectId(),
              name: 'creationDate',
              label: 'Date added',
              type: PropertyTypeEnum.Date,
            },
            {
              _id: new ObjectId(),
              name: 'editDate',
              label: 'Date modified',
              type: PropertyTypeEnum.Date,
            },
          ],

          properties: [
            { _id: textPropertyId, name: 'text', type: 'text', label: 'Text' },
            { name: 'auto_id', type: propertyTypes.generatedid, label: 'Auto Id' },
            { name: 'auto_id_1', type: propertyTypes.generatedid, label: 'Auto Id 1' },
          ],

          reindex: false,
        },
        'en'
      );

      affectedEntities = await entities.get({ template: templateId });
    });
    it('should assign the same value to all entities with the same sharedId', async () => {
      const generatedIds: { [k: string]: string } = {};
      affectedEntities.forEach(e => {
        const sharedId = e.sharedId as string;
        if (!generatedIds[sharedId]) {
          generatedIds[sharedId] = e.metadata!.auto_id![0].value as string;
        }
        expect(generatedIds[sharedId]).toEqual(e.metadata!.auto_id![0].value);
      });
    });
    it('should assign different values across sharedIds', async () => {
      const differentAutoId = affectedEntities
        .map(e => e.metadata!.auto_id![0].value)
        .filter(unique);
      expect(differentAutoId.length).toBe(2);
      const differentAutoId1 = affectedEntities
        .map(e => e.metadata!.auto_id_1![0].value)
        .filter(unique);
      expect(differentAutoId1.length).toBe(2);
      expect(affectedEntities[0].metadata!.text![0].value).toEqual('test');
    });
    it('should reindex updated templates', async () => {
      await elastic.indices.refresh();
      const indexedEntities: EntitySchema[] = await elasticTesting.getIndexedEntities();
      const updatedEntities = indexedEntities.filter(e => e.template === templateId.toString());
      expect(indexedEntities.length).toBe(5);
      expect(updatedEntities.length).toBe(4);
      updatedEntities.forEach(entity => {
        expect(entity.metadata).toEqual(
          expect.objectContaining({
            text: [{ value: 'test' }],
            auto_id: [
              expect.objectContaining({ value: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) }),
            ],
            auto_id_1: [
              expect.objectContaining({ value: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) }),
            ],
          })
        );
      });
    });
  });
});
