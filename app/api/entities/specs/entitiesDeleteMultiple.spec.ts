import entities from 'api/entities';
import { elasticTesting } from 'api/utils/elastic_testing';
import db, { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from '../../utils/fixturesFactory';
import entitiesModel from '../entitiesModel';

const load = async (data: DBFixture, index?: string) =>
  db.setupFixturesAndContext(
    {
      ...data,
      settings: [
        {
          _id: db.id(),
          languages: [
            { key: 'en', label: 'EN', default: true },
            { key: 'es', label: 'ES' },
          ],
        },
      ],
      translations: data.translations || [
        { locale: 'en', contexts: [] },
        { locale: 'es', contexts: [] },
      ],
    },
    index
  );

describe('Entities deleteMultiple', () => {
  const factory = getFixturesFactory();

  afterAll(async () => db.disconnect());

  describe('without errors', () => {
    beforeAll(async () => {
      const fixtures: DBFixture = {
        templates: [factory.template('templateA', [])],
        entities: [
          factory.entity('1', 'templateA'),
          factory.entity('2', 'templateA'),
          factory.entity('3', 'templateA'),
          factory.entity('4', 'templateA'),
        ],
      };
      await load(fixtures, 'entities.delete.multiple.spec');
      await entities.deleteMultiple(['1', '2', '4']);
    });

    it('should delete entities from db', async () => {
      const entitiesOnDb = await entities.get();
      expect(entitiesOnDb).toMatchObject([{ sharedId: '3' }]);
    });

    it('should delete entities from elastic', async () => {
      await elasticTesting.refresh();
      const entitiesOnElastic = await elasticTesting.getIndexedEntities();
      expect(entitiesOnElastic).toMatchObject([{ sharedId: '3' }]);
    });
  });

  describe('when some entity throws an error', () => {
    beforeAll(async () => {
      const fixtures: DBFixture = {
        templates: [factory.template('templateA', [])],
        entities: [
          factory.entity('1', 'templateA'),
          factory.entity('2', 'templateA'),
          factory.entity('3', 'templateA'),
          factory.entity('4', 'templateA'),
        ],
      };
      await load(fixtures, 'entities.delete.multiple.spec2');
      const originalDelete = entitiesModel.delete.bind(entitiesModel);
      jest.spyOn(entitiesModel, 'delete').mockImplementation(async deleteQuery => {
        if (deleteQuery.sharedId === '3') {
          throw new Error('Entity deletion error !');
        }
        return originalDelete(deleteQuery);
      });
    });

    it('should bubble up the error', async () => {
      await expect(async () => {
        await entities.deleteMultiple(['1', '2', '3', '4']);
      }).rejects.toEqual(new Error('Entity deletion error !'));
    });

    it('should delete the previous entities before the error on db', async () => {
      const entitiesOnDb = await entities.get();
      expect(entitiesOnDb.length).toBe(2);
      expect(entitiesOnDb[0]).toMatchObject({ sharedId: '3' });
      expect(entitiesOnDb[1]).toMatchObject({ sharedId: '4' });
    });

    it('should delete from elastic the entitites that were succesfully deleted from db', async () => {
      await elasticTesting.refresh();
      const entitiesOnElastic = await elasticTesting.getIndexedEntities();
      expect(entitiesOnElastic.length).toBe(2);
      expect(entitiesOnElastic[0]).toMatchObject({ sharedId: '3' });
      expect(entitiesOnElastic[1]).toMatchObject({ sharedId: '4' });
    });
  });
});
