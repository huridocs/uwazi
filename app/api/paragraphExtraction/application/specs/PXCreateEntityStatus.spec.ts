import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { MongoExtractorBuilder } from 'api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const createFixtures = (): DBFixture => ({
  relationtypes: [sourceRelationship, targetRelationship],
  templates: [sourceTemplate, targetTemplate],
  [mongoPXExtractorsCollection]: [extractor],
});

describe('PXCreateEntityStatus', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a EntityStatus');

  it.todo(
    'should do nothing if the created Entity does not have a template that match Extractor source template'
  );

  it.todo(
    'should do nothing if the created Entity does not have a Document with language that belongs to UI Language'
  );
});
