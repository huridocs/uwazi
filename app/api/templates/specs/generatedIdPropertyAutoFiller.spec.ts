import entities from 'api/entities';
import { populateGeneratedIdByTemplate } from 'api/entities/entityPropertiesUpdater';
import db from 'api/utils/testing_db';
import { fixtures, templateId } from 'api/entities/specs/entityPropertiesUpdaterFixtures';
import { unique } from 'api/utils/filters';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { propertyTypes } from 'shared/propertyTypes';

describe('entity properties updater', () => {
  beforeAll(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('fill generated id fields for entities of a specified template', () => {
    let affectedEntities: EntitySchema[];
    beforeAll(async () => {
      const properties: PropertySchema[] = [
        { name: 'text', type: 'text', label: 'Text' },
        { name: 'autoId', type: propertyTypes.generatedid, label: 'Auto Id' },
        { name: 'autoId1', type: propertyTypes.generatedid, label: 'Auto Id 1' },
      ];

      await populateGeneratedIdByTemplate(templateId, properties);
      affectedEntities = await entities.get({ template: templateId }, [
        'sharedId',
        'metadata.text',
        'metadata.autoId',
        'metadata.autoId1',
      ]);
    });
    it('should assign the same value to all entities with the same sharedId', async () => {
      const generatedIds: { [k: string]: string } = {};
      affectedEntities.forEach(e => {
        const sharedId = e.sharedId as string;
        if (!generatedIds[sharedId]) {
          generatedIds[sharedId] = e.metadata!.autoId![0].value as string;
        }
        expect(generatedIds[sharedId]).toEqual(e.metadata!.autoId![0].value);
      });
    });
    it('should assign different values across sharedIds', async () => {
      const differentAutoId = affectedEntities
        .map(e => e.metadata!.autoId![0].value)
        .filter(unique);
      expect(differentAutoId.length).toBe(2);
      const differentAutoId1 = affectedEntities
        .map(e => e.metadata!.autoId1![0].value)
        .filter(unique);
      expect(differentAutoId1.length).toBe(2);

      expect(affectedEntities[0].metadata!.text![0].value).toEqual('test');
    });
  });
});
