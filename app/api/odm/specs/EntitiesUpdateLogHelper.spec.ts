import { model } from 'api/entities';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { model as updatelogsModel } from 'api/updatelogs';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

const fixtureFactory = getFixturesFactory();

const fixtures = {
  entities: [fixtureFactory.entity('entity1'), fixtureFactory.entity('entity2')],
  files: [
    fixtureFactory.file('document1', 'entity1', 'document', 'document1_filename'),
    fixtureFactory.file('attachment1', 'entity1', 'attachment', 'attachment1_filename'),
    fixtureFactory.file('thumbnail1', 'entity1', 'thumbnail', 'thumbnail1_filename'),
    fixtureFactory.file('custom1', undefined, 'custom', 'custom1_filename'),
    fixtureFactory.file('document2', 'entity2', 'document', 'document2_filename'),
    fixtureFactory.file('attachment2', 'entity2', 'attachment', 'attachment2_filename'),
  ],
};

const logForEntity = (elem: EntitySchema) => ({
  mongoId: elem._id,
  namespace: 'entities',
});

const logForFile = (elem: FileType) => ({
  mongoId: elem._id,
  namespace: 'files',
});

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('EntitiesUpdateLogHelper', () => {
  describe('upsertLogOne', () => {
    it('should upsert the files for the entity', async () => {
      const entity = fixtures.entities[0];
      await model.save(entity);

      const logs = await updatelogsModel.find({}, '', { sort: { _id: 1 } });
      expect(logs.length).toBe(4);
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining(logForEntity(entity)),
          expect.objectContaining(logForFile(fixtures.files[0])),
          expect.objectContaining(logForFile(fixtures.files[1])),
          expect.objectContaining(logForFile(fixtures.files[2])),
        ])
      );
    });
  });
});
