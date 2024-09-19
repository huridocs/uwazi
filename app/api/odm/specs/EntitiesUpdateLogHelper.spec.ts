import { model } from 'api/entities';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { model as updatelogsModel } from 'api/updatelogs';

const fixtureFactory = getFixturesFactory();

const fixtures = {
  updatelogs: [
    fixtureFactory.updatelog('entities', 'entity1-en'),
    fixtureFactory.updatelog('files', 'document1'),
    fixtureFactory.updatelog('files', 'attachment1'),
    fixtureFactory.updatelog('files', 'thumbnail1'),
    fixtureFactory.updatelog('files', 'custom1'),
    fixtureFactory.updatelog('files', 'document2'),
    fixtureFactory.updatelog('files', 'attachment2'),
  ],
  entities: [
    fixtureFactory.entity('entity1', 'template1'),
    fixtureFactory.entity('entity2', 'template1'),
  ],
  files: [
    fixtureFactory.fileDeprecated('document1', 'entity1', 'document', 'document1_filename'),
    fixtureFactory.fileDeprecated('attachment1', 'entity1', 'attachment', 'attachment1_filename'),
    fixtureFactory.fileDeprecated('thumbnail1', 'entity1', 'thumbnail', 'thumbnail1_filename'),
    fixtureFactory.fileDeprecated('custom1', undefined, 'custom', 'custom1_filename'),
    fixtureFactory.fileDeprecated('document2', 'entity2', 'document', 'document2_filename'),
    fixtureFactory.fileDeprecated('attachment2', 'entity2', 'attachment', 'attachment2_filename'),
  ],
};

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

      [
        fixtureFactory.id('entities-entity1-en'),
        fixtureFactory.id('files-attachment1'),
        fixtureFactory.id('files-thumbnail1'),
        fixtureFactory.id('files-document1'),
      ].forEach(id => {
        const original = fixtures.updatelogs.find(log => log._id.toString() === id.toString());
        const current = logs.find(log => log._id.toString() === id.toString());

        expect(current!.timestamp).toBeGreaterThan(original!.timestamp! as number);
      });
    });
  });
});
