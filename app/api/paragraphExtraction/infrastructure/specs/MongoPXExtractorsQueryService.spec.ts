import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';

const factory = getFixturesFactory();

const createFixtures = (): DBFixture => ({
  templates: [factory.template('template1'), factory.template('template2')],
  entities: [
    factory.entity('entity1', { extractorId: factory.id('extractor1') }),
    factory.entity('entity2', { extractorId: factory.id('extractor1') }),
  ],
  extractors: [
    factory.extractor('extractor1', {
      sourceTemplateId: factory.id('template1'),
      targetTemplateId: factory.id('template2'),
    }),
  ],
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
  beforeEach(async () => {
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
          _id: factory.id('extractor1'),
          sourceTemplate: { _id: factory.id('template1'), name: 'Template 1' },
          targetTemplate: { _id: factory.id('template2'), name: 'Template 2' },
          entityCount: 2,
        },
      ]);
    });
  });
});
