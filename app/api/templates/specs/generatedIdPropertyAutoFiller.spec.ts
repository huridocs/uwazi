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
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import templates from '../templates';

describe('generatedId property auto filler', () => {
  beforeAll(async () => {
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    await db.setupFixturesAndContext(fixtures, 'generated_id_auto_filler_index');
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('fill generated id fields for entities of a specified template', () => {
    let affectedEntities: EntitySchema[];
    beforeAll(async () => {
      const templateToUpdate: TemplateSchema = {
        _id: templateId,
        name: 'template',
        commonProperties: [{ name: 'title', label: 'title', type: 'text' }],
        properties: [
          { _id: textPropertyId, name: 'text', type: 'text', label: 'Text' },
          { name: 'auto_id', type: propertyTypes.generatedid, label: 'Auto Id' },
          { name: 'auto_id_1', type: propertyTypes.generatedid, label: 'Auto Id 1' },
        ],
      };
      await templates.save(templateToUpdate, 'en', true);
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
            auto_id: [{ value: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) }],
            auto_id_1: [{ value: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) }],
          })
        );
      });
    });
  });
});
