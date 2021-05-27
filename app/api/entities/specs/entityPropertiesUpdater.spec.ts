import entities from 'api/entities';
import { populateGeneratedIdBTemplate } from 'api/entities/entityPropertiesUpdater';
import db from 'api/utils/testing_db';
import { fixtures, templateId } from 'api/entities/specs/entityPropertiesUpdaterFixtures';
import { unique } from 'api/utils/filters';

describe('entity properties updater', () => {
  describe('fill generated id', () => {
    beforeAll(async () => {
      await db.setupFixturesAndContext(fixtures);
    });
    describe('when the property is added', () => {
      it('should set a generated id by sharedId', async () => {
        await populateGeneratedIdBTemplate(templateId);
        const affectedEntities = await entities.get({ template: templateId }, [
          'sharedId',
          'metadata.autoId.value',
        ]);
        const generatedIds: { [k: string]: string } = {};
        affectedEntities.forEach(e => {
          if (!generatedIds[e.sharedId]) generatedIds[e.sharedId] = e.metadata.autoId.value;
          expect(generatedIds[e.sharedId]).toEqual(e.metadata.autoId.value);
        });
        const differentIds = affectedEntities.map(e => e.metadata.autoId.value).filter(unique);
        expect(differentIds.length).toBe(2);
      });
    });
  });
});
