import search from '../search';
import elasticTesting from 'api/utils/elastic_testing';

describe('custom language analyzers', () => {
  beforeEach((done) => {
    elasticTesting.reindex().then(done);
  });

  describe('persian', () => {
    it('should index persian without errors', () => {
      let persianText = `براي مشارکت فعال در کالس آماده باشيد. برای رسیدن به این هدف، بايد پیش از کالس به فايلهاي صوتي گوش کنيد،
ويديوها را ببينيد و تمرينهاي آنها را انجام دهيد. به صداهاي جديد گوش کنيد و حروف جديد را بنويسيد. هر چهقدر الزم است
اين کار را تکرار کنید، تا وقتي که شناختن و توليد اين صداها و حروف برايتان راحت و آسان شود. تمرينهاي در خانه را پيش
از کالس انجام دهيد تا براي خواندن و نوشتن در کالس آماده باشيد. وقت کالس بايد صرف تمرين شود، نه شنيدن سخنراني
استادتان.`;

      search.index({_id: 'id', fullText: persianText});
    });
  });
});
