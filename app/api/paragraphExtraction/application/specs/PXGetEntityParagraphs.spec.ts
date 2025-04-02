import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PXEntityParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXEntityParagraphsFactory';
import {
  extractorsQueryFixtures,
  entityFixtures,
  extractor1,
} from './shared/extractorsQueryFixtures';

const createFixtures = (): DBFixture => extractorsQueryFixtures;

const setupUseCase = () => {
  const getEntityParagraphs = PXEntityParagraphsFactory.createDefault();

  return getEntityParagraphs;
};

describe('PXGetEntityParagraphs', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should fetch and populate paginated paragraphs for an entity', async () => {
    const getExtractorStatuses = setupUseCase();

    const results = await getExtractorStatuses.execute({
      id: entityFixtures.entity1En.sharedId!.toString(),
      extractorId: extractor1._id.toString(),
      page: { number: 1, size: 2 },
    });

    expect(results.totalRows).toBe(3);
    expect(results.page).toMatchObject({ number: 1, size: 2 });
    expect(results.rows[0]).toMatchObject({
      sharedId: entityFixtures.paragraph2Entity1En.sharedId,
      entities: [
        { _id: entityFixtures.paragraph2Entity1En._id },
        { _id: entityFixtures.paragraph2Entity1Pt._id },
      ],
    });
    expect(results.rows[1]).toMatchObject({
      sharedId: entityFixtures.paragraph1Entity1En.sharedId,
      entities: [
        { _id: entityFixtures.paragraph1Entity1En._id },
        { _id: entityFixtures.paragraph1Entity1Pt._id },
      ],
    });
  });
});
