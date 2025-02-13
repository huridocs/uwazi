import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';
import { MongoPXExtractorDBO } from '../MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource';

const factory = getFixturesFactory();

const sourceTemplate = factory.template('sourceTemplate');
const sourceTemplate2 = factory.template('sourceTemplate2');

const targetTemplate = factory.template('targetTemplate');

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
};

const extractor2: MongoPXExtractorDBO = {
  _id: factory.id('extractor2'),
  sourceTemplateId: sourceTemplate2._id,
  targetTemplateId: targetTemplate._id,
};

const paragraph1 = factory.entity('paragraph1', sourceTemplate._id.toString());
paragraph1.extractionId = extractor._id;

const paragraph2 = factory.entity('paragraph2', sourceTemplate2._id.toString());
paragraph2.extractionId = extractor2._id;

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, sourceTemplate2, targetTemplate],
  entities: [paragraph1, paragraph2],
});

const setUpSut = () => {
  const db = getConnection();
  const transaction = DefaultTransactionManager();

  const extractorsQueryService = new MongoPXExtractorsQueryService(db, transaction);

  return {
    extractorsQueryService,
  };
};

describe('PXExtractorsQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getExtractors', () => {
    it('should return extractors with source and target templates and entity count', async () => {
      const { extractorsQueryService } = setUpSut();

      const result = await extractorsQueryService.getExtractors({}).all();

      expect(result).toEqual([
        {
          _id: extractor._id,
          sourceTemplate: { _id: sourceTemplate._id, name: sourceTemplate.name },
          targetTemplate: { _id: targetTemplate._id, name: targetTemplate.name },
          paragraphsQuantity: 1,
        },
        {
          _id: extractor2._id,
          sourceTemplate: { _id: sourceTemplate2._id, name: sourceTemplate2.name },
          targetTemplate: { _id: targetTemplate._id, name: targetTemplate.name },
          paragraphsQuantity: 1,
        },
      ]);
    });

    it('should return an empty array if no extractors are found', async () => {
      const fixtures = createFixtures();
      fixtures[mongoPXExtractorsCollection] = [];
      await testingEnvironment.setFixtures(fixtures);

      const { extractorsQueryService } = setUpSut();

      const result = await extractorsQueryService.getExtractors({}).all();

      expect(result).toEqual([]);
    });

    it('should return extractors with zero entity count if no entities are linked', async () => {
      const fixtures = createFixtures();
      fixtures.entities = [];
      await testingEnvironment.setFixtures(fixtures);

      const { extractorsQueryService } = setUpSut();

      const result = await extractorsQueryService.getExtractors({}).all();

      expect(result).toEqual([
        {
          _id: extractor._id,
          sourceTemplate: { _id: sourceTemplate._id, name: sourceTemplate.name },
          targetTemplate: { _id: targetTemplate._id, name: targetTemplate.name },
          paragraphsQuantity: 0,
        },
        {
          _id: extractor2._id,
          sourceTemplate: { _id: sourceTemplate2._id, name: sourceTemplate2.name },
          targetTemplate: { _id: targetTemplate._id, name: targetTemplate.name },
          paragraphsQuantity: 0,
        },
      ]);
    });
  });
});
