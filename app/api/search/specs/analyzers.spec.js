import elastic from '../elastic';
import elasticTesting from 'api/utils/elastic_testing';
import {index as elasticIndex} from 'api/config/elasticIndexes';

describe('custom language analyzers', () => {
  beforeEach((done) => {
    elasticTesting.resetIndex().then(done);
  });

  describe('persian', () => {
    it('should index persian without errors', (done) => {
      let persianText = `براي مشارکت فعال در کالس آماده باشيد. برای رسیدن به این هدف، بايد پیش از کالس به فايلهاي صوتي گوش کنيد،
ويديوها را ببينيد و تمرينهاي آنها را انجام دهيد. به صداهاي جديد گوش کنيد و حروف جديد را بنويسيد. هر چهقدر الزم است
اين کار را تکرار کنید، تا وقتي که شناختن و توليد اين صداها و حروف برايتان راحت و آسان شود. تمرينهاي در خانه را پيش
از کالس انجام دهيد تا براي خواندن و نوشتن در کالس آماده باشيد. وقت کالس بايد صرف تمرين شود، نه شنيدن سخنراني
استادتان.`;

      elastic.index({index: elasticIndex, type: 'fullText', body: {fullText_persian: persianText}, id: '123_whatever', parent: 123})
      .then(done)
      .catch(done.fail);
    });
  });
});
