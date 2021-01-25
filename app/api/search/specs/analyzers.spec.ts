import db from 'api/utils/testing_db';
import { elasticClient } from '../elastic';
import { fixturesTimeOut } from './fixtures_elastic';

describe('custom language analyzers', () => {
  const elasticIndex = 'analyzers_index_test';
  beforeAll(async () => {
    await db.clearAllAndLoad({}, elasticIndex);
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
  });

  describe('persian', () => {
    it('should index persian without errors', async () => {
      const persianText = `براي مشارکت فعال در کالس آماده باشيد. برای رسیدن به این هدف، بايد پیش از کالس به فايلهاي صوتي گوش کنيد،
ويديوها را ببينيد و تمرينهاي آنها را انجام دهيد. به صداهاي جديد گوش کنيد و حروف جديد را بنويسيد. هر چهقدر الزم است
اين کار را تکرار کنید، تا وقتي که شناختن و توليد اين صداها و حروف برايتان راحت و آسان شود. تمرينهاي در خانه را پيش
از کالس انجام دهيد تا براي خواندن و نوشتن در کالس آماده باشيد. وقت کالس بايد صرف تمرين شود، نه شنيدن سخنراني
استادتان.`;

      await elasticClient.index({
        index: elasticIndex,
        type: '_doc',
        body: { fullText_persian: persianText },
        id: '123_whatever',
      });
    });
  });
});
